import { BridgeComponent } from "@hotwired/hotwire-native-bridge";

export default class extends BridgeComponent {
    static component = "share";

    static values = {
        title: String,
        text: String,
        url: String,
    };

    share(event) {
        event.preventDefault();

        const payload = {
            title: this.titleValue || document.title,
            text: this.textValue || "",
            url: this.urlValue || window.location.href,
        };

        if (this.enabled) {
            this.send("share", payload);
            return;
        }

        if (navigator.share) {
            navigator.share(payload).catch(() => {});
            return;
        }

        if (navigator.clipboard) {
            navigator.clipboard.writeText(payload.url).catch(() => {});
        }
    }
}
