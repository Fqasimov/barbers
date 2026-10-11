<?php

namespace App\Jobs;

use App\Models\PushToken;
use App\Services\ExpoPush;
use Illuminate\Contracts\Queue\ShouldQueue;
use Illuminate\Foundation\Queue\Queueable;

class SendPush implements ShouldQueue
{
    use Queueable;

    public int $tries = 3;

    public array $backoff = [10, 60];

    public function __construct(
        public string $userId,
        public string $title,
        public string $body,
        public array $data = [],
    ) {
        $this->afterCommit();
    }

    public function handle(ExpoPush $push): void
    {
        $tokens = PushToken::query()->where('user_id', $this->userId)->pluck('token')->all();
        if ($tokens) {
            $push->send($tokens, $this->title, $this->body, $this->data);
        }
    }
}
