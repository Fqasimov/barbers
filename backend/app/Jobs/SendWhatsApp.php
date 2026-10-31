<?php

namespace App\Jobs;

use App\WhatsApp\WhatsAppSender;
use Illuminate\Contracts\Queue\ShouldQueue;
use Illuminate\Foundation\Queue\Queueable;

class SendWhatsApp implements ShouldQueue
{
    use Queueable;

    public int $tries = 3;

    public array $backoff = [30, 120];

    public function __construct(public string $phone, public string $template, public array $params)
    {
        $this->afterCommit();
    }

    public function handle(WhatsAppSender $sender): void
    {
        $sender->send($this->phone, $this->template, $this->params);
    }
}
