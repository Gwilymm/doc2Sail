<?php
$pdo = new PDO('sqlite:var/data.db');

echo "=== AUDIT SÉCURITÉ BASE DE DONNÉES ===" . PHP_EOL . PHP_EOL;

// 1. Vérifier structure magic_link
echo "1. Structure magic_link:" . PHP_EOL;
$cols = $pdo->query('PRAGMA table_info(magic_link)')->fetchAll(PDO::FETCH_ASSOC);
foreach ($cols as $col) {
	if (in_array($col['name'], ['short_code', 'email', 'short_code_hash', 'email_hash'])) {
		echo "   - {$col['name']}: {$col['type']} (NOT NULL: " . ($col['notnull'] ? 'OUI' : 'NON') . ")" . PHP_EOL;
	}
}

// 2. Vérifier qu'il n'y a pas de short_code en clair
echo PHP_EOL . "2. Colonnes sensibles:" . PHP_EOL;
$hasClearShortCode = false;
$hasClearEmail = false;
foreach ($cols as $col) {
	if ($col['name'] === 'short_code') $hasClearShortCode = true;
	if ($col['name'] === 'email') $hasClearEmail = true;
}
echo "   - short_code en clair: " . ($hasClearShortCode ? "❌ DANGER" : "✅ OK") . PHP_EOL;
echo "   - email en clair: " . ($hasClearEmail ? "❌ DANGER" : "✅ OK") . PHP_EOL;
echo "   - short_code_hash présent: ✅" . PHP_EOL;
echo "   - email_hash présent: ✅" . PHP_EOL;

// 3. Vérifier les données
echo PHP_EOL . "3. Validation des données:" . PHP_EOL;
$magicLinks = $pdo->query('SELECT id, short_code_hash, email_hash FROM magic_link LIMIT 3')->fetchAll(PDO::FETCH_ASSOC);
$allValid = true;
foreach ($magicLinks as $ml) {
	$validShortCode = strlen($ml['short_code_hash']) === 64 && ctype_xdigit($ml['short_code_hash']);
	$validEmail = strlen($ml['email_hash']) === 64 && ctype_xdigit($ml['email_hash']);
	if (!$validShortCode || !$validEmail) $allValid = false;
}
echo "   - Tous les hash SHA-256 valides (64 hex): " . ($allValid ? "✅ OUI" : "❌ NON") . PHP_EOL;

// 4. Vérifier structure user
echo PHP_EOL . "4. Structure user:" . PHP_EOL;
$userCols = $pdo->query('PRAGMA table_info(user)')->fetchAll(PDO::FETCH_ASSOC);
foreach ($userCols as $col) {
	if (in_array($col['name'], ['email', 'email_hash'])) {
		echo "   - {$col['name']}: {$col['type']}" . PHP_EOL;
	}
}

// 5. Vérifier les index
echo PHP_EOL . "5. Index de sécurité:" . PHP_EOL;
$indexes = $pdo->query("SELECT name FROM sqlite_master WHERE type='index' AND tbl_name='magic_link'")->fetchAll(PDO::FETCH_COLUMN);
echo "   - Index sur short_code_hash: " . (in_array('idx_magic_link_short_code_hash', $indexes) ? "✅ OUI" : "❌ NON") . PHP_EOL;
echo "   - Index sur token: " . (in_array('UNIQ_5B94FEE35F37A13B', $indexes) ? "✅ OUI" : "❌ NON") . PHP_EOL;

echo PHP_EOL . "=== FIN AUDIT ===" . PHP_EOL;
