<?php

namespace App\Controller;

use App\Entity\Regatta;
use App\Repository\RegattaRepository;
use App\Service\DocumentUploader;
use Doctrine\ORM\EntityManagerInterface;
use Symfony\Bundle\FrameworkBundle\Controller\AbstractController;
use Symfony\Component\DependencyInjection\ParameterBag\ParameterBagInterface;
use Symfony\Component\HttpFoundation\JsonResponse;
use Symfony\Component\HttpFoundation\Request;
use Symfony\Component\HttpFoundation\Response;
use Symfony\Component\Routing\Attribute\Route;
use Symfony\Component\Validator\Validator\ValidatorInterface;

class RegattaController extends AbstractController
{
    public function __construct(
        private EntityManagerInterface $entityManager,
        private RegattaRepository $regattaRepository,
        private ValidatorInterface $validator,
        private ParameterBagInterface $params,
        private DocumentUploader $documentUploader,
    ) {}

    #[Route('/regatta', name: 'app_regatta')]
    public function index(): Response
    {
        $regattas = $this->regattaRepository->findBy([], ['startDate' => 'DESC']);

        return $this->render('regatta/index.html.twig', [
            'regattas' => $regattas,
        ]);
    }

    #[Route('/regatta/create', name: 'app_regatta_create', methods: ['POST'])]
    public function create(Request $request): JsonResponse
    {
        $data = json_decode($request->getContent(), true);

        $regatta = new Regatta();
        $regatta->setName($data['name'] ?? '');
        $regatta->setDescription($data['description'] ?? null);

        try {
            $regatta->setStartDate(new \DateTime($data['startDate']));
            $regatta->setEndDate(new \DateTime($data['endDate']));
        } catch (\Exception $e) {
            return new JsonResponse(['error' => 'Dates invalides'], 400);
        }

        // Validation
        $errors = $this->validator->validate($regatta);
        if (count($errors) > 0) {
            $errorMessages = [];
            foreach ($errors as $error) {
                $errorMessages[] = $error->getMessage();
            }
            return new JsonResponse(['error' => implode(', ', $errorMessages)], 400);
        }

        // Vérifier que la date de fin est après la date de début
        if ($regatta->getEndDate() < $regatta->getStartDate()) {
            return new JsonResponse(['error' => 'La date de fin doit être après la date de début'], 400);
        }

        $this->entityManager->persist($regatta);
        $this->entityManager->flush();

        return new JsonResponse([
            'success' => true,
            'message' => 'Régate créée avec succès',
            'regatta' => [
                'id' => $regatta->getId(),
                'name' => $regatta->getName(),
                'startDate' => $regatta->getStartDate()->format('Y-m-d'),
                'endDate' => $regatta->getEndDate()->format('Y-m-d'),
                'description' => $regatta->getDescription(),
            ]
        ]);
    }

    #[Route('/regatta/{id}/update', name: 'app_regatta_update', methods: ['POST'])]
    public function update(Regatta $regatta, Request $request): JsonResponse
    {
        $data = json_decode($request->getContent(), true);

        if (isset($data['name'])) {
            $regatta->setName($data['name']);
        }
        if (isset($data['description'])) {
            $regatta->setDescription($data['description']);
        }

        try {
            if (isset($data['startDate'])) {
                $regatta->setStartDate(new \DateTime($data['startDate']));
            }
            if (isset($data['endDate'])) {
                $regatta->setEndDate(new \DateTime($data['endDate']));
            }
        } catch (\Exception $e) {
            return new JsonResponse(['error' => 'Dates invalides'], 400);
        }

        // Validation
        $errors = $this->validator->validate($regatta);
        if (count($errors) > 0) {
            $errorMessages = [];
            foreach ($errors as $error) {
                $errorMessages[] = $error->getMessage();
            }
            return new JsonResponse(['error' => implode(', ', $errorMessages)], 400);
        }

        if ($regatta->getEndDate() < $regatta->getStartDate()) {
            return new JsonResponse(['error' => 'La date de fin doit être après la date de début'], 400);
        }

        $this->entityManager->flush();

        return new JsonResponse([
            'success' => true,
            'message' => 'Régate modifiée avec succès',
            'regatta' => [
                'id' => $regatta->getId(),
                'name' => $regatta->getName(),
                'startDate' => $regatta->getStartDate()->format('Y-m-d'),
                'endDate' => $regatta->getEndDate()->format('Y-m-d'),
                'description' => $regatta->getDescription(),
            ]
        ]);
    }

    #[Route('/regatta/{id}/delete', name: 'app_regatta_delete', methods: ['POST'])]
    public function delete(Regatta $regatta): JsonResponse
    {
        try {
            $regattaId = $regatta->getId();

            // Supprimer le répertoire complet de la régate (avec tous les fichiers)
            $this->documentUploader->deleteRegattaDirectory($regattaId);

            // Supprimer la régate (et les documents associés grâce au cascade)
            $this->entityManager->remove($regatta);
            $this->entityManager->flush();

            return new JsonResponse([
                'success' => true,
                'message' => 'Régate supprimée avec succès'
            ]);
        } catch (\Exception $e) {
            return new JsonResponse(['error' => $e->getMessage()], 500);
        }
    }

    #[Route('/regatta/list', name: 'app_regatta_list')]
    public function list(): JsonResponse
    {
        $regattas = $this->regattaRepository->findBy([], ['startDate' => 'DESC']);

        $result = array_map(function (Regatta $regatta) {
            return [
                'id' => $regatta->getId(),
                'name' => $regatta->getName(),
                'startDate' => $regatta->getStartDate()->format('Y-m-d'),
                'endDate' => $regatta->getEndDate()->format('Y-m-d'),
                'description' => $regatta->getDescription(),
                'documentsCount' => $regatta->getDocuments()->count(),
            ];
        }, $regattas);

        return new JsonResponse($result);
    }

    #[Route('/regatta/{id}/documents', name: 'app_regatta_documents')]
    public function documents(Regatta $regatta): Response
    {
        return $this->render('regatta/documents.html.twig', [
            'regatta' => $regatta,
            'documents' => $regatta->getDocuments(),
        ]);
    }

    #[Route('/r/{token}', name: 'app_regatta_public')]
    public function publicView(string $token): Response
    {
        $regatta = $this->regattaRepository->findOneBy(['accessToken' => $token]);

        if (!$regatta) {
            throw $this->createNotFoundException('Cette régate n\'existe pas ou n\'est plus accessible.');
        }

        return $this->render('regatta/public.html.twig', [
            'regatta' => $regatta,
            'documents' => $regatta->getDocuments(),
        ]);
    }
}
