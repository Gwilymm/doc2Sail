<?php

namespace App\Controller;

use Endroid\QrCode\Builder\Builder;
use Endroid\QrCode\Encoding\Encoding;
use Endroid\QrCode\ErrorCorrectionLevel;
use Endroid\QrCode\RoundBlockSizeMode;
use Endroid\QrCode\Writer\PngWriter;
use App\Repository\RegattaRepository;
use Symfony\Bundle\FrameworkBundle\Controller\AbstractController;
use Symfony\Component\HttpFoundation\Response;
use Symfony\Component\Routing\Attribute\Route;
use Symfony\Component\Routing\Generator\UrlGeneratorInterface;
use Symfony\Component\Routing\Exception\RouteNotFoundException;

class QRCodeController extends AbstractController
{
    public function __construct(private RegattaRepository $regattaRepository) {}
    #[Route('/qrcode/generate', name: 'app_qrcode_generate')]
    public function generate(): Response
    {
        // URL absolue pour le QR code (modifiez selon vos besoins)
        $url = $this->generateUrl('app_home', [], UrlGeneratorInterface::ABSOLUTE_URL);

        $builder = new Builder(
            writer: new PngWriter(),
            writerOptions: [],
            validateResult: false,
            data: $url,
            encoding: new Encoding('UTF-8'),
            errorCorrectionLevel: ErrorCorrectionLevel::High,
            size: 300,
            margin: 10,
            roundBlockSizeMode: RoundBlockSizeMode::Margin
        );

        $result = $builder->build();

        return new Response(
            $result->getString(),
            Response::HTTP_OK,
            ['Content-Type' => $result->getMimeType()]
        );
    }

    #[Route('/qrcode/modal/{type}/{id}', name: 'app_qrcode_modal', defaults: ['id' => null])]
    public function modal(string $type, ?string $id = null): Response
    {
        // Générer l'URL en fonction du type
        // Générer l'URL en fonction du type, en gérant les routes manquantes
        $routeMissing = false;
        $missingRoute = null;
        $errorMessage = null;

        $url = null;

        if ($type === 'document') {
            if ($id) {
                try {
                    $url = $this->generateUrl('app_document_view', ['id' => $id], UrlGeneratorInterface::ABSOLUTE_URL);
                } catch (RouteNotFoundException $e) {
                    $routeMissing = true;
                    $missingRoute = 'app_document_view';
                    $errorMessage = 'La route pour l\'aperçu du document est introuvable, utilisation de la page d\'accueil.';
                    $url = $this->generateUrl('app_home', [], UrlGeneratorInterface::ABSOLUTE_URL);
                }
            } else {
                $routeMissing = true;
                $missingRoute = 'app_document_view';
                $errorMessage = 'Identifiant de document manquant.';
                $url = $this->generateUrl('app_home', [], UrlGeneratorInterface::ABSOLUTE_URL);
            }
        } elseif ($type === 'regatta') {
            if ($id) {
                // Try to use public URL token if available
                try {
                    $regatta = $this->regattaRepository->find($id);
                    if ($regatta && $regatta->getAccessToken()) {
                        $url = $this->generateUrl('app_regatta_public', ['token' => $regatta->getAccessToken()], UrlGeneratorInterface::ABSOLUTE_URL);
                        // If we successfully generated public URL, skip other fallbacks
                    } else {
                        // No token, proceed with previous logic
                        try {
                            $url = $this->generateUrl('app_regatta_view', ['id' => $id], UrlGeneratorInterface::ABSOLUTE_URL);
                        } catch (RouteNotFoundException $e) {
                            try {
                                $url = $this->generateUrl('app_regatta_documents', ['id' => $id], UrlGeneratorInterface::ABSOLUTE_URL);
                                $routeMissing = true;
                                $missingRoute = 'app_regatta_view';
                                $errorMessage = 'La page de visualisation de la régate n\'existe pas, affichage des documents.';
                            } catch (RouteNotFoundException $e2) {
                                // final fallback to regatta index
                                $url = $this->generateUrl('app_regatta', [], UrlGeneratorInterface::ABSOLUTE_URL);
                                $routeMissing = true;
                                $missingRoute = 'app_regatta_view/app_regatta_documents';
                                $errorMessage = 'Les routes Regatta sont manquantes, redirection vers la liste des régates.';
                            }
                        }
                    }
                } catch (\Exception $e) {
                    // If repository lookup fails, fall back to old behavior
                    try {
                        $url = $this->generateUrl('app_regatta_view', ['id' => $id], UrlGeneratorInterface::ABSOLUTE_URL);
                    } catch (RouteNotFoundException $e) {
                        try {
                            $url = $this->generateUrl('app_regatta_documents', ['id' => $id], UrlGeneratorInterface::ABSOLUTE_URL);
                        } catch (RouteNotFoundException $e2) {
                            $url = $this->generateUrl('app_regatta', [], UrlGeneratorInterface::ABSOLUTE_URL);
                            $routeMissing = true;
                            $missingRoute = 'app_regatta_view/app_regatta_documents';
                            $errorMessage = 'Les routes Regatta sont manquantes, redirection vers la liste des régates.';
                        }
                    }
                }
            } else {
                // No id -> use regatta listing
                try {
                    $url = $this->generateUrl('app_regatta', [], UrlGeneratorInterface::ABSOLUTE_URL);
                } catch (RouteNotFoundException $e) {
                    $routeMissing = true;
                    $missingRoute = 'app_regatta';
                    $errorMessage = 'La liste des régates est indisponible.';
                    $url = $this->generateUrl('app_home', [], UrlGeneratorInterface::ABSOLUTE_URL);
                }
            }
        } else {
            // home or default
            $url = $this->generateUrl('app_home', [], UrlGeneratorInterface::ABSOLUTE_URL);
        }

        $builder = new Builder(
            writer: new PngWriter(),
            writerOptions: [],
            validateResult: false,
            data: $url,
            encoding: new Encoding('UTF-8'),
            errorCorrectionLevel: ErrorCorrectionLevel::High,
            size: 400,
            margin: 10,
            roundBlockSizeMode: RoundBlockSizeMode::Margin
        );

        $result = $builder->build();

        $qrCodeDataUri = $result->getDataUri();

        $regattaName = null;
        $regattaDates = null;
        if (isset($regatta) && $regatta) {
            $regattaName = $regatta->getName();
            $regattaDates = sprintf('%s - %s', $regatta->getStartDate()?->format('d/m/Y'), $regatta->getEndDate()?->format('d/m/Y'));
        }

        return $this->render('qrcode/modal.html.twig', [
            'qr_code_data_uri' => $qrCodeDataUri,
            'url' => $url,
            'type' => $type,
            'id' => $id,
            'route_missing' => $routeMissing,
            'missing_route' => $missingRoute,
            'error_message' => $errorMessage,
            'regatta_name' => $regattaName,
            'regatta_dates' => $regattaDates,
        ]);
    }

    #[Route('/qrcode/image/{type}/{id}', name: 'app_qrcode_image', defaults: ['id' => null])]
    public function image(string $type, ?string $id = null): Response
    {
        // Générer l'URL en fonction du type, en gérant les routes manquantes (fallbacks)
        if ($type === 'document') {
            if ($id) {
                try {
                    $url = $this->generateUrl('app_document_view', ['id' => $id], UrlGeneratorInterface::ABSOLUTE_URL);
                } catch (RouteNotFoundException $e) {
                    $url = $this->generateUrl('app_home', [], UrlGeneratorInterface::ABSOLUTE_URL);
                }
            } else {
                $url = $this->generateUrl('app_home', [], UrlGeneratorInterface::ABSOLUTE_URL);
            }
        } elseif ($type === 'regatta') {
            if ($id) {
                // Prefer public URL if regatta has token
                try {
                    $regatta = $this->regattaRepository->find($id);
                    if ($regatta && $regatta->getAccessToken()) {
                        $url = $this->generateUrl('app_regatta_public', ['token' => $regatta->getAccessToken()], UrlGeneratorInterface::ABSOLUTE_URL);
                    } else {
                        try {
                            $url = $this->generateUrl('app_regatta_view', ['id' => $id], UrlGeneratorInterface::ABSOLUTE_URL);
                        } catch (RouteNotFoundException $e) {
                            try {
                                $url = $this->generateUrl('app_regatta_documents', ['id' => $id], UrlGeneratorInterface::ABSOLUTE_URL);
                            } catch (RouteNotFoundException $e2) {
                                try {
                                    $url = $this->generateUrl('app_regatta', [], UrlGeneratorInterface::ABSOLUTE_URL);
                                } catch (RouteNotFoundException $e3) {
                                    $url = $this->generateUrl('app_home', [], UrlGeneratorInterface::ABSOLUTE_URL);
                                }
                            }
                        }
                    }
                } catch (\Exception $e) {
                    try {
                        $url = $this->generateUrl('app_regatta_view', ['id' => $id], UrlGeneratorInterface::ABSOLUTE_URL);
                    } catch (RouteNotFoundException $e) {
                        try {
                            $url = $this->generateUrl('app_regatta_documents', ['id' => $id], UrlGeneratorInterface::ABSOLUTE_URL);
                        } catch (RouteNotFoundException $e2) {
                            $url = $this->generateUrl('app_regatta', [], UrlGeneratorInterface::ABSOLUTE_URL);
                        }
                    }
                }
            } else {
                try {
                    $url = $this->generateUrl('app_regatta', [], UrlGeneratorInterface::ABSOLUTE_URL);
                } catch (RouteNotFoundException $e) {
                    $url = $this->generateUrl('app_home', [], UrlGeneratorInterface::ABSOLUTE_URL);
                }
            }
        } else {
            $url = $this->generateUrl('app_home', [], UrlGeneratorInterface::ABSOLUTE_URL);
        }

        $builder = new Builder(
            writer: new PngWriter(),
            writerOptions: [],
            validateResult: false,
            data: $url,
            encoding: new Encoding('UTF-8'),
            errorCorrectionLevel: ErrorCorrectionLevel::High,
            size: 400,
            margin: 10,
            roundBlockSizeMode: RoundBlockSizeMode::Margin
        );

        $result = $builder->build();

        return new Response(
            $result->getString(),
            Response::HTTP_OK,
            [
                'Content-Type' => $result->getMimeType(),
                'Content-Disposition' => 'inline; filename="qrcode.png"'
            ]
        );
    }
}
