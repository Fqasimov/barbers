<?php

namespace App\Payments;

use App\Exceptions\ApiException;

class InvalidCallback extends ApiException
{
    public function __construct(string $message = 'The payment callback could not be verified.')
    {
        parent::__construct(400, 'invalid_callback', $message);
    }
}
