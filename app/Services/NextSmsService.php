<?php

namespace App\Services;

/**
 * NextSmsService
 *
 * For backward compatibility with existing codebase references.
 * Now extends and delegates natively to SwalaSmsService.
 */
class NextSmsService extends SwalaSmsService
{
    // Inherits all SwalaSMS methods (sendSms, normalizePhoneNumber, calculateSegments, getBalance, sendBulk)
}
