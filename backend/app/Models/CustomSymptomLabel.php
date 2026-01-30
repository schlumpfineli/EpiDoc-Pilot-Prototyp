<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;

class CustomSymptomLabel extends Model
{
    protected $fillable = ['symptom_id', 'label'];

    protected $table = 'custom_symptom_labels';
}
