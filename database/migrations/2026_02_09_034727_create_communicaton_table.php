<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    /**
     * Run the migrations.
     */
    public function up(): void
    {
    Schema::create('communicaton', function (Blueprint $table) {
    $table->id();
    $table->timestamps();
    $table->string('from')->nullable(); 
    $table->longtext('particulars')->nullable();
    $table->string('proponent')->nullable();
    $table->string('type')->default('request');
    $table->foreignId('incharge_id')
          ->nullable() 
          ->constrained('incharge')
          ->onDelete('cascade');
    $table->foreignId('offices_id')
          ->nullable() 
          ->constrained()
          ->onDelete('cascade');

          $table->string('status')->default('in progress');
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::dropIfExists('communicaton');
    }
};
