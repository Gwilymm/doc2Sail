<?php

namespace App\Native;

use Symfony\UX\Native\Attribute\AsNativeConfiguration;
use Symfony\UX\Native\Attribute\AsNativeConfigurationProvider;
use Symfony\UX\Native\Configuration\Configuration;
use Symfony\UX\Native\Configuration\Rule;

#[AsNativeConfigurationProvider]
final class AppNativeConfiguration
{
    #[AsNativeConfiguration('/native/ios_v1.json')]
    public function iosV1(): Configuration
    {
        return $this->buildConfiguration('ios');
    }

    #[AsNativeConfiguration('/native/android_v1.json')]
    public function androidV1(): Configuration
    {
        return $this->buildConfiguration('android');
    }

    private function buildConfiguration(string $platform): Configuration
    {
        return new Configuration(
            settings: [
                'platform' => $platform,
                'app_name' => 'Doc2Sail',
                'use_local_db' => false,
            ],
            rules: [
                new Rule(
                    patterns: [
                        '/regatta$',
                        '/regatta/.*',
                        '/(en|fr)/regatta$',
                        '/(en|fr)/regatta/.*',
                        '/r/.*',
                        '/(en|fr)/r/.*',
                    ],
                    properties: [
                        'context' => 'default',
                        'pull_to_refresh_enabled' => true,
                    ],
                ),
                new Rule(
                    patterns: [
                        '/login',
                        '/login_check',
                        '/logout',
                        '/auth/.*',
                        '/(en|fr)/login',
                        '/(en|fr)/login_check',
                        '/(en|fr)/logout',
                        '/(en|fr)/auth/.*',
                    ],
                    properties: [
                        'context' => 'default',
                        'pull_to_refresh_enabled' => false,
                    ],
                ),
                new Rule(
                    patterns: [
                        '/document/.*/view',
                        '/document/.*/viewer',
                        '/(en|fr)/document/.*/view',
                        '/(en|fr)/document/.*/viewer',
                    ],
                    properties: [
                        'context' => 'modal',
                        'pull_to_refresh_enabled' => false,
                    ],
                ),
                new Rule(
                    patterns: [
                        '/document/.*/download',
                        '/document/.*/file',
                        '/(en|fr)/document/.*/download',
                        '/(en|fr)/document/.*/file',
                    ],
                    properties: [
                        'context' => 'external',
                        'pull_to_refresh_enabled' => false,
                    ],
                ),
                new Rule(
                    patterns: ['.*'],
                    properties: [
                        'context' => 'default',
                        'pull_to_refresh_enabled' => false,
                    ],
                ),
            ],
        );
    }
}
