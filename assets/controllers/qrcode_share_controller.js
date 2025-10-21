import { Controller } from "@hotwired/stimulus";

export default class extends Controller {
    static targets = [ "qrImage", "qrContainer", "urlInput", "shareButton" ];

    connect() {
        // Masquer le bouton de partage natif si l'API n'est pas disponible
        if (!navigator.share && this.hasShareButtonTarget) {
            this.shareButtonTarget.style.display = "none";
        }
    }

    /**
     * Copier l'URL dans le presse-papiers
     */
    async copyUrl(event) {
        event.preventDefault();

        try {
            await navigator.clipboard.writeText(this.urlInputTarget.value);

            // Feedback visuel - changer le bouton temporairement
            const button = event.currentTarget;
            const svg = button.querySelector("svg");
            const originalHTML = button.innerHTML;

            button.innerHTML = `
                <svg xmlns="http://www.w3.org/2000/svg" class="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M5 13l4 4L19 7" />
                </svg>
            `;
            button.classList.add("btn-success");

            setTimeout(() => {
                button.innerHTML = originalHTML;
                button.classList.remove("btn-success");
            }, 2000);

            this.showToast("URL copiée dans le presse-papiers", "success");
        } catch (err) {
            console.error("Erreur lors de la copie:", err);

            // Fallback pour les navigateurs plus anciens
            this.urlInputTarget.select();
            try {
                document.execCommand("copy");
                this.showToast("URL copiée", "success");
            } catch (e) {
                this.showToast("Impossible de copier l'URL", "error");
            }
        }
    }

    /**
     * Imprimer le QR code
     */
    print(event) {
        event.preventDefault();
        try {
            const dataUri = this.qrImageTarget.src;
            const ua = navigator.userAgent || "";
            const isMobile = /android|iphone|ipad|ipod/i.test(ua);

            if (isMobile) {
                // Mobile: use default print
                window.print();
                return;
            }

            // Desktop: create a hidden iframe to print a minimal document containing only the QR image
            const iframe = document.createElement('iframe');
            iframe.style.position = 'fixed';
            iframe.style.right = '0';
            iframe.style.bottom = '0';
            iframe.style.width = '0';
            iframe.style.height = '0';
            iframe.style.border = '0';
            iframe.style.overflow = 'hidden';
            document.body.appendChild(iframe);

            const doc = iframe.contentWindow.document;
            doc.open();
            doc.write(`<!doctype html><html><head><title>QR Code - Doc2Sail</title><style>
                html,body{height:100%;margin:0;padding:0}
                body{display:flex;align-items:center;justify-content:center}
                img{max-width:100%;height:auto;page-break-inside:avoid}
                @media print { body{margin:0} img{page-break-inside:avoid} }
            </style></head><body><img src="${dataUri}" alt="QR Code"></body></html>`);
            doc.close();

            const printAndRemove = () => {
                try {
                    iframe.contentWindow.focus();
                    iframe.contentWindow.print();
                } catch (e) {
                    console.error('Iframe print error', e);
                    window.print();
                }
                setTimeout(() => { document.body.removeChild(iframe); }, 500);
            };

            // If iframe content is still loading (image), wait for load
            const imgEl = doc.querySelector('img');
            if (imgEl) {
                if (imgEl.complete) {
                    printAndRemove();
                } else {
                    imgEl.addEventListener('load', printAndRemove);
                    imgEl.addEventListener('error', printAndRemove);
                }
            } else {
                // No image found for some reason, fallback
                setTimeout(printAndRemove, 300);
            }
        } catch (err) {
            console.error('Print error', err);
            window.print();
        }
    }

    /**
     * Télécharger le QR code en tant qu'image
     */
    async download(event) {
        event.preventDefault();

        try {
            const dataUri = this.qrImageTarget.src;

            // Créer un lien temporaire pour le téléchargement
            const link = document.createElement("a");
            link.href = dataUri;
            link.download = `qrcode-${Date.now()}.png`;
            document.body.appendChild(link);
            link.click();
            document.body.removeChild(link);

            this.showToast("QR code téléchargé avec succès", "success");
        } catch (err) {
            console.error("Erreur lors du téléchargement:", err);
            this.showToast("Impossible de télécharger le QR code", "error");
        }
    }

    /**
     * Partager via WhatsApp
     */
    shareWhatsApp(event) {
        event.preventDefault();

        const url = this.urlInputTarget.value;
        const text = encodeURIComponent("Découvrez ce contenu : " + url);

        // Use deep link on mobile apps, web API for desktop
        const ua = navigator.userAgent || "";
        const isMobile = /android|iphone|ipad|ipod/i.test(ua);
        const mobileLink = `whatsapp://send?text=${text}`;
        const webLink = `https://api.whatsapp.com/send?text=${text}`;
        const shareUrl = isMobile ? mobileLink : webLink;

        const win = window.open(shareUrl, "_blank", "noopener,noreferrer");
        if (!win) {
            // Fallback: navigate in same tab (may open app or web)
            window.location.href = shareUrl;
        }
    }

    /**
     * Partager par email
     */
    shareEmail(event) {
        event.preventDefault();

        const url = this.urlInputTarget.value;
        const subject = encodeURIComponent("Partage de QR code - Doc2Sail");
        const body = encodeURIComponent(
            `Bonjour,\n\n` +
            `Je partage avec vous ce lien :\n${url}\n\n` +
            `Vous pouvez également scanner le QR code ci-joint.\n\n` +
            `Cordialement`,
        );
        const mailtoUrl = `mailto:?subject=${subject}&body=${body}`;

        window.location.href = mailtoUrl;
    }

    /**
     * Partager via l'API native de partage (Web Share API)
     */
    async shareNative(event) {
        event.preventDefault();

        if (!navigator.share) {
            this.showToast(
                "Le partage n'est pas disponible sur ce navigateur",
                "error",
            );
            return;
        }

        try {
            // Convertir le data URI en Blob pour le partage
            const dataUri = this.qrImageTarget.src;
            const blob = await this.dataURItoBlob(dataUri);
            const file = new File([ blob ], "qrcode.png", { type: "image/png" });

            const shareData = {
                title: "QR Code - Doc2Sail",
                text: "Scannez ce QR code pour accéder au contenu",
                url: this.urlInputTarget.value,
                files: [ file ],
            };

            // Vérifier si le partage de fichiers est supporté
            if (navigator.canShare && navigator.canShare(shareData)) {
                await navigator.share(shareData);
                this.showToast("Contenu partagé avec succès", "success");
            } else {
                // Fallback sans fichier
                await navigator.share({
                    title: "QR Code - Doc2Sail",
                    text: "Découvrez ce contenu",
                    url: this.urlInputTarget.value,
                });
                this.showToast("Lien partagé avec succès", "success");
            }
        } catch (err) {
            // L'utilisateur a annulé le partage
            if (err.name !== "AbortError") {
                console.error("Erreur lors du partage:", err);
                this.showToast("Erreur lors du partage", "error");
            }
        }
    }

    /**
     * Convertir un data URI en Blob
     */
    async dataURItoBlob(dataURI) {
        const response = await fetch(dataURI);
        return await response.blob();
    }

    /**
     * Afficher une notification toast (compatible DaisyUI)
     */
    showToast(message, type = "info") {
        // Vérifier si Symfony UX Notify est disponible
        if (
            window.Turbo &&
            document.querySelector('[data-controller="notify"]')
        ) {
            // Utiliser le système de notification Symfony UX
            const event = new CustomEvent("notify", {
                detail: { message, type },
            });
            window.dispatchEvent(event);
            return;
        }

        // Fallback: créer un toast DaisyUI manuel
        const toast = document.createElement("div");
        toast.className = "toast toast-top toast-end z-50";

        const alertClass =
            type === "success"
                ? "alert-success"
                : type === "error"
                    ? "alert-error"
                    : type === "warning"
                        ? "alert-warning"
                        : "alert-info";

        toast.innerHTML = `
            <div class="alert ${alertClass}">
                <span>${message}</span>
            </div>
        `;

        document.body.appendChild(toast);

        // Ajouter une animation d'entrée
        setTimeout(() => {
            toast.querySelector(".alert").classList.add("animate-pulse");
        }, 10);

        // Retirer après 3 secondes
        setTimeout(() => {
            toast.classList.add(
                "opacity-0",
                "transition-opacity",
                "duration-500",
            );
            setTimeout(() => {
                document.body.removeChild(toast);
            }, 500);
        }, 3000);
    }
}
