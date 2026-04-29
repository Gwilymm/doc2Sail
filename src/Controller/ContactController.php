<?php

namespace App\Controller;

use Doctrine\Persistence\ManagerRegistry;
use Symfony\Bundle\FrameworkBundle\Controller\AbstractController;
use Symfony\Component\Mailer\Exception\TransportExceptionInterface;
use Symfony\Component\Mailer\MailerInterface;
use Symfony\Component\Mime\Email;
use Symfony\Component\HttpFoundation\JsonResponse;
use Symfony\Component\HttpFoundation\Request;
use Symfony\Component\HttpFoundation\Response;
use Symfony\Component\Routing\Attribute\Route;
use Symfony\Component\Security\Csrf\CsrfTokenManagerInterface;
use Symfony\Component\Security\Csrf\CsrfToken;
use Symfony\Contracts\Translation\TranslatorInterface;
use Psr\Log\LoggerInterface;
use App\Entity\ContactMessage;

class ContactController extends AbstractController
{
	#[Route('/contact', name: 'app_contact')]
	public function contact(Request $request, MailerInterface $mailer, ManagerRegistry $doctrine, CsrfTokenManagerInterface $csrfManager, TranslatorInterface $translator, LoggerInterface $logger): Response
	{
		if ($request->isMethod('POST')) {
			$data = json_decode($request->getContent(), true);
			$name = isset($data['name']) ? trim($data['name']) : null;
			$email = isset($data['email']) ? trim($data['email']) : null;
			$subject = isset($data['subject']) ? trim($data['subject']) : null;
			$message = isset($data['message']) ? trim($data['message']) : null;
			$csrf = $data['_csrf_token'] ?? null;

			// CSRF check
			if (! $csrfManager->isTokenValid(new CsrfToken('contact_form', $csrf))) {
				return new JsonResponse(['success' => false, 'error' => $translator->trans('base.contact.error_invalid_csrf', [], 'base')], Response::HTTP_BAD_REQUEST);
			}

			// Strict validation & sanitization
			if (! $email || ! filter_var($email, FILTER_VALIDATE_EMAIL)) {
				return new JsonResponse(['success' => false, 'error' => $translator->trans('base.contact.error_invalid_email', [], 'base')], Response::HTTP_BAD_REQUEST);
			}

			if (! $message || mb_strlen($message) < 5) {
				return new JsonResponse(['success' => false, 'error' => $translator->trans('base.contact.error_short_message', [], 'base')], Response::HTTP_BAD_REQUEST);
			}

			// enforce length limits (user requested limits)
			if ($name && mb_strlen($name) > 100) {
				return new JsonResponse(['success' => false, 'error' => $translator->trans('base.contact.error_name_too_long', [], 'base')], Response::HTTP_BAD_REQUEST);
			}
			if ($subject && mb_strlen($subject) > 150) {
				return new JsonResponse(['success' => false, 'error' => $translator->trans('base.contact.error_subject_too_long', [], 'base')], Response::HTTP_BAD_REQUEST);
			}
			if (mb_strlen($message) > 2000) {
				return new JsonResponse(['success' => false, 'error' => $translator->trans('base.contact.error_message_too_long', [], 'base')], Response::HTTP_BAD_REQUEST);
			}

			// truncate persisted fields conservatively to prevent DB issues
			$name = $name ? mb_substr($name, 0, 100) : null;
			$subject = $subject ? mb_substr($subject, 0, 150) : null;
			$email = mb_substr($email, 0, 254);
			$message = mb_substr($message, 0, 2000);

			// Persist contact message
			$em = $doctrine->getManager();
			$contact = new ContactMessage();
			$contact->setName($name);
			$contact->setEmail($email);
			$contact->setSubject($subject);
			$contact->setMessage($message);
			$em->persist($contact);
			$em->flush();

			// Build and send email to contact@doc2sail.com
			// We set From to the sender's email (note: some SMTP providers may reject arbitrary From addresses). We also set Reply-To.
			$safeName = htmlspecialchars($name ?: 'No name');
			$safeEmail = htmlspecialchars($email);
			$safeMessage = nl2br(htmlspecialchars($message));
			$now = (new \DateTime())->format('Y-m-d H:i');

			$emailHeader = $translator->trans('base.contact.email_header', [], 'base');
			$replyLine = $translator->trans('base.contact.email_reply_line', [], 'base');

			$html = <<<HTML
						<html>
						<head>
							<meta charset="utf-8" />
							<style>
								body { font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial; color: #111827; }
								.header { background: #0ea5a4; color: #fff; padding: 12px 20px; border-radius: 6px 6px 0 0; }
								.container { border: 1px solid #e6e6e6; border-radius: 8px; overflow: hidden; }
								.content { padding: 18px; }
								.meta { font-size: 13px; color: #6b7280; margin-bottom: 12px; }
								.message { background: #f9fafb; padding: 12px; border-radius: 6px; color: #111827; }
								.footer { font-size: 12px; color: #9ca3af; margin-top: 14px; }
							</style>
						</head>
						<body>
							<div class="container">
								<div class="header"><strong>Doc2Sail — Contact form</strong></div>
								<div class="content">
									<div class="meta">Date: {$now}</div>
									<div class="meta"><strong>From:</strong> {$safeName} </div>
									<div class="meta"><strong>Email:</strong> {$safeEmail}</div>
									<div class="meta"><strong>Subject:</strong> Contact form submission</div>
									<div class="message">{$safeMessage}</div>
									<div class="footer">{$replyLine}</div>
								</div>
							</div>
						</body>
						</html>
						HTML;

			$text = sprintf("Contact form submission\nDate: %s\nFrom: %s <%s>\n\n%s", $now, $name ?: 'No name', $email, $message);

			// Respect provider rules: use the configured MAILER_FROM as From and recipient.
			$siteEmail = getenv('MAILER_FROM') ?: 'contact@doc2sail.com';

			$emailMessage = (new Email())
				->from($siteEmail)
				->to($siteEmail)
				->replyTo($email)
				->subject(sprintf('Contact form: %s', $subject ?: ($name ?: 'No name')))
				->html($html)
				->text($text);

			try {
				$mailer->send($emailMessage);
			} catch (TransportExceptionInterface $e) {
				$logger->error('Contact form: failed to send email', ['exception' => $e, 'siteEmail' => $siteEmail]);
				return new JsonResponse(['success' => false, 'error' => $translator->trans('base.contact.error_generic', [], 'base')], Response::HTTP_INTERNAL_SERVER_ERROR);
			}

			return new JsonResponse(['success' => true, 'message' => $translator->trans('base.contact.success', [], 'base')]);
		}

		return $this->render('contact/contact.html.twig');
	}
}
