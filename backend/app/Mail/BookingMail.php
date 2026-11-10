<?php

namespace App\Mail;

use App\Models\Booking;
use Illuminate\Bus\Queueable;
use Illuminate\Contracts\Queue\ShouldQueue;
use Illuminate\Mail\Mailable;
use Illuminate\Mail\Mailables\Content;
use Illuminate\Mail\Mailables\Envelope;
use Illuminate\Queue\SerializesModels;

/**
 * To the salon: created | cancelled_by_customer.
 * To the client: confirmed | reminder_24h | reminder_2h | cancelled_by_salon.
 */
class BookingMail extends Mailable implements ShouldQueue
{
    use Queueable, SerializesModels;

    public function __construct(public Booking $booking, public string $kind, public array $lines)
    {
        $this->afterCommit();
    }

    public function envelope(): Envelope
    {
        $salon = $this->booking->business?->name ?? 'yazılnow';
        $subject = match ($this->kind) {
            'created' => 'yazılnow: yeni bron / новая запись / new booking',
            'confirmed' => "yazılnow: bron təsdiqləndi / запись подтверждена / booking confirmed · {$salon}",
            'reminder_24h' => "yazılnow: sabah · завтра · tomorrow · {$salon}",
            'reminder_2h' => "yazılnow: 2 saat sonra · через 2 часа · in 2 hours · {$salon}",
            default => 'yazılnow: bron ləğv edildi / запись отменена / booking cancelled',
        };

        return new Envelope(subject: $subject);
    }

    public function content(): Content
    {
        return new Content(text: 'mail.booking');
    }
}
