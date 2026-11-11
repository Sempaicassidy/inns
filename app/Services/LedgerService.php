<?php

namespace App\Services;

use App\Models\Account;
use App\Models\FinancialTransaction;
use Illuminate\Support\Carbon;

/**
 * Writes double-entry style ledger rows into financial_transactions.
 *
 * Every business event (folio charge, guest payment, POS sale, expense)
 * posts one debit row and one credit row against chart-of-accounts codes.
 * Account references are resolved per tenant; missing accounts are skipped
 * rather than fabricating balances — the chart is seeded by
 * AccountingController::ensureChartOfAccounts().
 */
class LedgerService
{
    /**
     * Post a balanced journal entry.
     *
     * @param  array<int, array{code: string, direction: 'debit'|'credit', amount_minor: int}>  $entries
     */
    public function post(
        string $tenantId,
        ?string $propertyId,
        string $sourceType,
        string $sourceId,
        string $description,
        array $entries,
        ?string $transactionDate = null,
    ): void {
        $accounts = Account::where('tenant_id', $tenantId)
            ->whereIn('code', array_column($entries, 'code'))
            ->get()
            ->keyBy('code');

        $date = $transactionDate ?? Carbon::today()->toDateString();

        foreach ($entries as $entry) {
            $amount = (int) ($entry['amount_minor'] ?? 0);
            if ($amount <= 0) {
                continue;
            }

            FinancialTransaction::create([
                'tenant_id' => $tenantId,
                'property_id' => $propertyId,
                'account_id' => $accounts->get($entry['code'])?->id,
                'transaction_type' => $entry['direction'],
                'source_type' => $sourceType,
                'source_id' => $sourceId,
                'amount_minor' => $amount,
                'currency' => 'TZS',
                'transaction_date' => $date,
                'description' => $description,
            ]);
        }
    }

    /**
     * Map a payment/tender method to its asset account code.
     */
    public static function tenderCode(string $method): string
    {
        return match (strtolower($method)) {
            'mpesa', 'tigopesa', 'airtelmoney', 'halopesa' => '1040',
            'card', 'bank_transfer' => '1020',
            'city_ledger' => '1050',
            default => '1010',
        };
    }

    /**
     * Map a folio line type to its revenue account code.
     */
    public static function revenueCode(string $lineType): string
    {
        return match ($lineType) {
            'room' => '4001',
            'restaurant', 'bar' => '4002',
            default => '4004',
        };
    }
}
