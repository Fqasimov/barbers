<?php

namespace App\Exceptions;

use Illuminate\Http\JsonResponse;
use RuntimeException;

/** An API error the app understands: `{ "error": "<code>", "message": "…" }`. */
class ApiException extends RuntimeException
{
    public function __construct(
        public readonly int $status,
        public readonly string $errorCode,
        string $message = '',
        public readonly array $extra = [],
    ) {
        parent::__construct($message !== '' ? $message : str_replace('_', ' ', ucfirst($errorCode)));
    }

    public static function notFound(string $message = 'Not found.'): self
    {
        return new self(404, 'not_found', $message);
    }

    public static function forbidden(string $message = 'This belongs to another business.'): self
    {
        return new self(403, 'forbidden', $message);
    }

    public function render(): JsonResponse
    {
        return response()->json(['error' => $this->errorCode, 'message' => $this->getMessage()] + $this->extra, $this->status);
    }
}
