<?php

namespace App\Services;

/**
 * SwalaSmsService
 *
 * Maintained for backward compatibility across existing controllers and services.
 * Now extends and natively delegates all SMS operations to DarSmsService.
 */
class SwalaSmsService extends DarSmsService
{
    // Inherits all Dar SMS methods: sendSms, sendBulk, getBalance, calculateSegments, normalizePhoneNumber
}
