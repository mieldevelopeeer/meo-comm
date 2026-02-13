<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;

class Communication extends Model
{
    use HasFactory;

    protected $table = 'communicaton'; 

    protected $fillable = [
        'from',
        'status',
        'particulars',
        'proponent',
        'offices_id',
        'incharge_id',
        'type',
        
    ];

    /**
     * Get the office that owns the communication.
     */
    public function office()
    {
        return $this->belongsTo(Office::class, 'offices_id');
    }
    /**
     * Get the in-charge person for the communication.
     */
    public function incharge()
    {
        return $this->belongsTo(Incharge::class, 'incharge_id');
    }
}