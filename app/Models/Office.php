<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;

class Office extends Model
{
    use HasFactory;
    protected $table = 'offices';
    protected $fillable = [
        'name',
        'status',
    ];

    /**
     * Get the communications for the office.
     */
    public function communications()
    {
        return $this->hasMany(Communication::class, 'offices_id');
    }
}