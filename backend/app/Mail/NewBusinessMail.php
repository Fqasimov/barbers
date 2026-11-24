<?php

namespace App\Mail;

use Illuminate\Bus\Queueable;
use Illuminate\Contracts\Queue\ShouldQueue;
use Illuminate\Mail\Mailable;
use Illuminate\Mail\Mailables\Content;
use Illuminate\Mail\Mailables\Envelope;

/** To the yazılnow team: a business signed up and waits for review in the admin. */
class NewBusinessMail extends Mailable implements ShouldQueue
{
    use Queueable;

    public function __construct(
        public string $name,
        public string $kind,
        public string $district,
        public string $owner,
        public string $email,
        public string $phone,
        public string $adminUrl,
    ) {}

    public function envelope(): Envelope
    {
        return new Envelope(subject: "yazılnow: yeni biznes yoxlanış gözləyir — {$this->name}");
    }

    public function content(): Content
    {
        return new Content(text: 'mail.new-business');
    }
}
