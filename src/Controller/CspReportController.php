<?php

namespace App\Controller;

use Nelmio\SecurityBundle\ContentSecurityPolicy\Violation\Report;
use Psr\Log\LoggerInterface;
use Symfony\Bundle\FrameworkBundle\Controller\AbstractController;
use Symfony\Component\HttpFoundation\Request;
use Symfony\Component\HttpFoundation\Response;
use Symfony\Component\Routing\Annotation\Route;

class CspReportController extends AbstractController
{
	#[Route('/nelmio/csp/report', name: 'nelmio_csp_report', methods: ['GET', 'POST'])]
	public function report(Request $request, LoggerInterface $logger): Response
	{
		try {
			$report = Report::fromRequest($request);
			// Log minimal details for debugging
			$logger->info('CSP report received', [
				'data' => $report->getData(),
				'userAgent' => $report->getUserAgent(),
			]);
		} catch (\Throwable $e) {
			$logger->warning('CSP report error: ' . $e->getMessage());
			// Return 204 so the browser doesn't retry or expose details
			return new Response('', Response::HTTP_NO_CONTENT);
		}

		return new Response('', Response::HTTP_NO_CONTENT);
	}
}
