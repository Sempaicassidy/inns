<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Concerns\HasUuids;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

class OccurrenceBookAmendment extends Model
{
    use HasUuids;

    protected $table = 'occurrence_book_amendments';

    protected $fillable = [
        'occurrence_book_entry_id',
        'original_values',
        'amended_values',
        'reason',
        'amended_by_user_id',
    ];

    protected function casts(): array
    {
        return [
            'original_values' => 'array',
            'amended_values' => 'array',
        ];
    }

    public function entry(): BelongsTo
    {
        return $this->belongsTo(OccurrenceBookEntry::class, 'occurrence_book_entry_id');
    }

    public function amendedBy(): BelongsTo
    {
        return $this->belongsTo(User::class, 'amended_by_user_id');
    }
}
