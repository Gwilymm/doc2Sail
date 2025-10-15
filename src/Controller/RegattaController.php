<?php

namespace App\Controller;

use App\Entity\Document;
use App\Entity\Regatta;
use App\Entity\RegattaInvitation;
use App\Entity\User;
use App\Repository\DocumentRepository;
use App\Repository\RegattaRepository;
use App\Repository\RegattaInvitationRepository;
use App\Repository\UserRepository;
use App\Service\DocumentUploader;
use Doctrine\ORM\EntityManagerInterface;
use Symfony\Bundle\FrameworkBundle\Controller\AbstractController;
use Symfony\Component\DependencyInjection\ParameterBag\ParameterBagInterface;
use Symfony\Component\HttpFoundation\JsonResponse;
use Symfony\Component\HttpFoundation\Request;
use Symfony\Component\HttpFoundation\Response;
use Symfony\Component\Mailer\MailerInterface;
use Symfony\Component\Mime\Email;
use Symfony\Component\Routing\Attribute\Route;
use Symfony\Component\Routing\Generator\UrlGeneratorInterface;
use Symfony\Component\Validator\Validator\ValidatorInterface;

class RegattaController extends AbstractController
{
    public function __construct(
        private EntityManagerInterface $entityManager,
    private RegattaRepository $regattaRepository,
    private DocumentRepository $documentRepository,
        private UserRepository $userRepository,
        private RegattaInvitationRepository $invitationRepository,
        private ValidatorInterface $validator,
        private ParameterBagInterface $params,
        private DocumentUploader $documentUploader,
        private MailerInterface $mailer,
    ) {}

    #[Route('/regatta', name: 'app_regatta')]
    public function index(Request $request): Response
    {
        dump('=== REGATTA INDEX CALLED ===');
        dump('Is Authenticated: ' . ($this->getUser() ? 'YES' : 'NO'));

        /** @var User|null $currentUser */
        /** @var User|null $currentUser */
        $currentUser = $this->getUser();

        if ($currentUser) {
            dump('Current User ID: ' . $currentUser->getId());
            dump('Current User Roles:', $currentUser->getRoles());
            dump('Current User Identifier:', $currentUser->getUserIdentifier());
        } else {
            dump('NO USER - SHOULD BE REDIRECTED BY SECURITY');
        }

        // Symfony Security gère déjà l'accès avec access_control
        // Pas besoin de vérification manuelle ici

        // Ne récupérer que les régates de l'utilisateur connecté
        $regattas = $this->regattaRepository->findBy(
            ['owner' => $currentUser],
            ['startDate' => 'DESC']
        );

        return $this->render('regatta/index.html.twig', [
            'regattas' => $regattas,
        ]);
    }

    #[Route('/regatta/create', name: 'app_regatta_create', methods: ['POST'])]
    public function create(Request $request): JsonResponse
    {
        /** @var User|null $currentUser */
        $currentUser = $this->getUser();

        if (!$currentUser) {
            return new JsonResponse(['error' => 'Vous devez être connecté pour créer une régate'], 403);
        }

        $data = json_decode($request->getContent(), true);

        $regatta = new Regatta();
        $regatta->setName($data['name'] ?? '');
        $regatta->setDescription($data['description'] ?? null);
        $regatta->setOwner($currentUser); // Attribuer l'utilisateur courant

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
        /** @var User|null $currentUser */
        $currentUser = $this->getUser();

        // Vérifier que l'utilisateur peut gérer cette régate (propriétaire ou copropriétaire)
        if (!$currentUser || !$regatta->canManage($currentUser)) {
            return new JsonResponse(['error' => 'Vous n\'avez pas l\'autorisation de modifier cette régate'], 403);
        }

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
    public function delete(Regatta $regatta, Request $request): JsonResponse
    {
        /** @var User|null $currentUser */
        $currentUser = $this->getUser();

        // Vérifier que l'utilisateur est le propriétaire
        if (!$currentUser || $regatta->getOwner() !== $currentUser) {
            return new JsonResponse(['error' => 'Vous n\'avez pas l\'autorisation de supprimer cette régate'], 403);
        }

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
    public function list(Request $request): JsonResponse
    {
        /** @var User|null $currentUser */
        $currentUser = $this->getUser();

        if (!$currentUser) {
            return new JsonResponse(['error' => 'Vous devez être connecté'], 403);
        }

        // Ne retourner que les régates de l'utilisateur connecté
        $regattas = $this->regattaRepository->findBy(
            ['owner' => $currentUser],
            ['startDate' => 'DESC']
        );

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
    public function documents(Regatta $regatta, Request $request): Response
    {
        /** @var User|null $currentUser */
        $currentUser = $this->getUser();

        // Vérifier que l'utilisateur peut gérer cette régate (propriétaire ou copropriétaire)
        if (!$currentUser || !$regatta->canManage($currentUser)) {
            $this->addFlash('error', 'Vous n\'avez pas l\'autorisation d\'accéder à cette régate.');
            return $this->redirectToRoute('app_regatta');
        }

        $documents = $this->documentRepository->findByRegattaSorted($regatta);

        $documentsByCategory = [];
        foreach ($documents as $document) {
            $category = $document->getCategory();
            $documentsByCategory[$category][] = $document;
        }

        return $this->render('regatta/documents.html.twig', [
            'regatta' => $regatta,
            'documentsByCategory' => $documentsByCategory,
            'documentsCount' => count($documents),
            'documentCategories' => Document::AVAILABLE_CATEGORIES,
            'defaultCategory' => Document::DEFAULT_CATEGORY,
        ]);
    }

    #[Route('/regatta/{id}/invite', name: 'app_regatta_invite', methods: ['POST'])]
    public function inviteCoOwner(Regatta $regatta, Request $request): JsonResponse
    {
        /** @var User|null $currentUser */
        $currentUser = $this->getUser();

        // Seul le propriétaire peut inviter des copropriétaires
        if (!$currentUser || $regatta->getOwner() !== $currentUser) {
            return new JsonResponse(['error' => 'Seul le propriétaire peut inviter des copropriétaires'], 403);
        }

        $data = json_decode($request->getContent(), true);
        $email = trim(strtolower($data['email'] ?? ''));

        if (empty($email) || !filter_var($email, FILTER_VALIDATE_EMAIL)) {
            return new JsonResponse(['error' => 'Adresse email invalide'], 400);
        }

        // Vérifier si l'email n'est pas celui du propriétaire
        if ($currentUser->verifyEmail($email)) {
            return new JsonResponse(['error' => 'Vous êtes déjà propriétaire de cette régate'], 400);
        }

        // Vérifier si l'utilisateur existe et n'est pas déjà copropriétaire
        $existingUser = $this->userRepository->findByEmail($email);
        if ($existingUser && $regatta->isCoOwner($existingUser)) {
            return new JsonResponse(['error' => 'Cet utilisateur est déjà copropriétaire'], 400);
        }

        // Créer l'invitation
        $invitation = new RegattaInvitation();
        $invitation->setRegatta($regatta);
        $invitation->setInvitedEmail($email);
        $invitation->setInvitedBy($currentUser);

        $this->entityManager->persist($invitation);
        $this->entityManager->flush();

        // Envoyer l'email d'invitation
        $invitationUrl = $this->generateUrl('app_regatta_accept_invitation', [
            'token' => $invitation->getToken()
        ], UrlGeneratorInterface::ABSOLUTE_URL);

        $emailMessage = (new Email())
            ->from($this->params->get('mailer_from'))
            ->to($email)
            ->subject('🎯 Invitation à rejoindre une régate sur Doc2Sail')
            ->html($this->renderView('auth/regatta_invitation_email.html.twig', [
                'invitation' => $invitation,
                'invitationUrl' => $invitationUrl,
                'regatta' => $regatta,
                'invitedBy' => $currentUser,
            ]));

        try {
            $this->mailer->send($emailMessage);
            return new JsonResponse([
                'success' => true,
                'message' => 'Invitation envoyée avec succès'
            ]);
        } catch (\Exception $e) {
            return new JsonResponse([
                'success' => false,
                'error' => 'Erreur lors de l\'envoi de l\'invitation',
                'debug_url' => $invitationUrl
            ]);
        }
    }

    #[Route('/regatta/invitation/{token}', name: 'app_regatta_accept_invitation')]
    public function acceptInvitation(string $token, Request $request): Response
    {
        $invitation = $this->invitationRepository->findValidToken($token);

        if (!$invitation || !$invitation->isValid()) {
            $this->addFlash('error', 'Cette invitation est invalide ou a expiré.');
            return $this->redirectToRoute('app_home');
        }

        $regatta = $invitation->getRegatta();
        $email = $invitation->getInvitedEmail();

        // Trouver ou créer l'utilisateur
        $user = $this->userRepository->findByEmail($email);

        if (!$user) {
            // L'utilisateur n'existe pas encore, on doit d'abord l'authentifier
            // On stocke l'invitation dans la session pour l'accepter après l'authentification
            $session = $request->getSession();
            $session->set('pending_invitation_token', $token);

            $this->addFlash('info', 'Veuillez vous connecter pour accepter l\'invitation.');
            return $this->redirectToRoute('app_login');
        }

        // Vérifier si l'utilisateur est connecté
        /** @var User|null $currentUser */
        $currentUser = $this->getUser();

        if (!$currentUser) {
            // Pas connecté, rediriger vers login avec l'invitation en attente
            $session = $request->getSession();
            $session->set('pending_invitation_token', $token);

            $this->addFlash('info', 'Veuillez vous connecter pour accepter l\'invitation.');
            return $this->redirectToRoute('app_login');
        }

        // Vérifier que c'est bien le bon utilisateur
        if (!$currentUser->verifyEmail($email)) {
            $this->addFlash('error', 'Cette invitation est destinée à une autre adresse email.');
            return $this->redirectToRoute('app_regatta');
        }

        // Ajouter comme copropriétaire
        if (!$regatta->isCoOwner($currentUser)) {
            $regatta->addCoOwner($currentUser);
            $invitation->setUsed(true);
            $this->entityManager->flush();

            $this->addFlash('success', sprintf(
                '✅ Vous êtes maintenant copropriétaire de la régate "%s" !',
                $regatta->getName()
            ));
        } else {
            $this->addFlash('info', 'Vous êtes déjà copropriétaire de cette régate.');
        }

        return $this->redirectToRoute('app_regatta_documents', ['id' => $regatta->getId()]);
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

    /**
     * Récupère l'utilisateur actuellement connecté via la session
     */
}
