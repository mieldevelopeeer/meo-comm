<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;

class Incharge extends Model
{
    use HasFactory;

    protected $table = 'incharge';
    
    protected $fillable = [
        'firstname',
        'lastname',
        'middlename',
        'suffix',
    ];

    /**
     * The accessors to append to the model's array form.
     *
     * @var array
     */
    protected $appends = ['full_name'];

    /**
     * Get the communications assigned to this in-charge.
     */
    public function communications()
    {
        return $this->hasMany(Communication::class, 'incharge_id');
    }

    /**
     * Get the full name of the in-charge person.
     */
    public function getFullNameAttribute()
    {
        $parts = array_filter([
            $this->firstname,
            $this->middlename,
            $this->lastname,
        ]);
        
        $name = implode(' ', $parts);
        
        return $this->suffix ? "{$name}, {$this->suffix}" : $name;
    }
}