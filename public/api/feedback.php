<?php
declare(strict_types=1);

// noplan feedback endpoint: POST JSON {category, message, email?, website?} -> mail to admin.
// Stores nothing. The only thing written to disk is a hashed-IP timestamp list in the system
// temp dir, used to rate-limit, and pruned as it is read.

header('Content-Type: application/json; charset=utf-8');
header('Cache-Control: no-store');
header('X-Content-Type-Options: nosniff');

const TO_ADDRESS = 'admin@no-plan.app';
const FROM_ADDRESS = 'noreply@no-plan.app';
const ALLOWED_HOSTS = ['no-plan.app', 'www.no-plan.app'];
const CATEGORIES = ['bug' => 'Bug', 'idea' => 'Idea', 'praise' => 'Praise', 'other' => 'Other'];
const MIN_MESSAGE = 5;
const MAX_MESSAGE = 4000;
const PER_VISITOR_LIMIT = 5;    // messages per visitor per hour
const GLOBAL_LIMIT = 60;        // messages per hour across everyone, caps a flood
const WINDOW_SECONDS = 3600;

function respond(int $status, array $body): never
{
    http_response_code($status);
    echo json_encode($body, JSON_UNESCAPED_UNICODE);
    exit;
}

function fail(int $status, string $code): never
{
    respond($status, ['ok' => false, 'error' => $code]);
}

/** Returns true when $key already used its $limit sends in the window; otherwise records this send. */
function rate_limited(string $key, int $limit, int $window): bool
{
    $dir = sys_get_temp_dir() . '/noplan-feedback';
    if (!is_dir($dir) && !@mkdir($dir, 0700, true) && !is_dir($dir)) {
        return false; // can't rate limit; don't block real people
    }
    $file = $dir . '/' . hash('sha256', $key) . '.json';
    $handle = @fopen($file, 'c+');
    if ($handle === false) {
        return false;
    }
    flock($handle, LOCK_EX);
    $now = time();
    $stamps = json_decode((string) stream_get_contents($handle), true);
    $stamps = is_array($stamps) ? array_values(array_filter($stamps, fn ($t) => is_int($t) && $t > $now - $window)) : [];
    $limited = count($stamps) >= $limit;
    if (!$limited) {
        $stamps[] = $now;
        ftruncate($handle, 0);
        rewind($handle);
        fwrite($handle, json_encode($stamps));
    }
    flock($handle, LOCK_UN);
    fclose($handle);
    return $limited;
}

if (($_SERVER['REQUEST_METHOD'] ?? '') !== 'POST') {
    header('Allow: POST');
    fail(405, 'method_not_allowed');
}

// Browsers send Origin on cross-site POSTs; reject anything not from this site.
$origin = $_SERVER['HTTP_ORIGIN'] ?? '';
if ($origin !== '' && !in_array(parse_url($origin, PHP_URL_HOST), ALLOWED_HOSTS, true)) {
    fail(403, 'forbidden');
}

$data = json_decode((string) file_get_contents('php://input', false, null, 0, 16384), true);
if (!is_array($data)) {
    fail(400, 'invalid_request');
}

// Honeypot: real visitors never fill this hidden field. Pretend success so bots move on.
if (trim((string) ($data['website'] ?? '')) !== '') {
    respond(200, ['ok' => true]);
}

$message = trim(str_replace(["\r\n", "\r"], "\n", (string) ($data['message'] ?? '')));
$length = mb_strlen($message);
if ($length < MIN_MESSAGE) {
    fail(422, 'message_too_short');
}
if ($length > MAX_MESSAGE) {
    fail(422, 'message_too_long');
}

$category = (string) ($data['category'] ?? 'other');
if (!isset(CATEGORIES[$category])) {
    $category = 'other';
}

$email = trim((string) ($data['email'] ?? ''));
if ($email !== '' && (strlen($email) > 254 || preg_match('/[\r\n]/', $email) || !filter_var($email, FILTER_VALIDATE_EMAIL))) {
    fail(422, 'invalid_email');
}

// The CDN sits in front of this host, so REMOTE_ADDR can be a shared edge address.
$forwarded = trim(explode(',', (string) ($_SERVER['HTTP_X_FORWARDED_FOR'] ?? ''))[0]);
$visitor = $forwarded !== '' ? $forwarded : (string) ($_SERVER['REMOTE_ADDR'] ?? 'unknown');
if (rate_limited('v:' . $visitor, PER_VISITOR_LIMIT, WINDOW_SECONDS) || rate_limited('global', GLOBAL_LIMIT, WINDOW_SECONDS)) {
    fail(429, 'rate_limited');
}

$body = implode("\n", [
    'Category: ' . CATEGORIES[$category],
    'Reply to: ' . ($email !== '' ? $email : '(not provided)'),
    'Received: ' . gmdate('Y-m-d H:i') . ' UTC',
    '',
    $message,
    '',
]);

$headers = [
    'From: noplan feedback <' . FROM_ADDRESS . '>',
    'MIME-Version: 1.0',
    'Content-Type: text/plain; charset=UTF-8',
    'Content-Transfer-Encoding: base64',
];
if ($email !== '') {
    $headers[] = 'Reply-To: ' . $email;
}

$sent = mail(
    TO_ADDRESS,
    '[noplan feedback] ' . CATEGORIES[$category],
    chunk_split(base64_encode($body)),
    implode("\r\n", $headers)
);

if (!$sent) {
    error_log('noplan feedback: mail() returned false');
    fail(500, 'send_failed');
}

respond(200, ['ok' => true]);
