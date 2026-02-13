<?php

    use App\Http\Controllers\ProfileController;
    use App\Http\Controllers\CommunicationController;
    use App\Http\Controllers\InchargeController;
    use App\Http\Controllers\RecordsController;
    use App\Http\Controllers\OfficeController;
    use Illuminate\Foundation\Application;
    use App\Http\Controllers\DashboardController; 
    use App\Http\Controllers\FileController;  
    use Illuminate\Support\Facades\Route;
    use Inertia\Inertia;

    /*
    |--------------------------------------------------------------------------
    | Web Routes
    |--------------------------------------------------------------------------
    |
    | Here is where you can register web routes for your application. These
    | routes are loaded by the RouteServiceProvider within a group which
    | contains the "web" middleware group. Now create something great!
    |
    */

    // Redirect root to login
    Route::get('/', function () {
        return redirect()->route('login');
    })->name('home');

    // Dashboard Routes - Protected
    Route::get('/dashboard', [DashboardController::class, 'index'])
        ->middleware(['auth', 'verified'])
        ->name('dashboard');
        
    Route::middleware(['auth', 'verified'])->group(function () {
        Route::get('/dashboard/statistics', [DashboardController::class, 'statistics']);
        Route::get('/dashboard/recent', [DashboardController::class, 'recent']);
        Route::get('/dashboard/analytics', [DashboardController::class, 'analytics']);
    });

    // All authenticated routes
    Route::middleware(['auth', 'verified'])->group(function () {

        // Communications Routes
        Route::resource('communications', CommunicationController::class)
            ->only(['index', 'store', 'update', 'destroy']);

        // Incharges Routes
        Route::get('/incharges', [InchargeController::class, 'index'])->name('incharges.index');
        Route::post('/incharges', [InchargeController::class, 'store'])->name('incharges.store');
        Route::put('/incharges/{incharge}', [InchargeController::class, 'update'])->name('incharges.update');
        Route::delete('/incharges/{incharge}', [InchargeController::class, 'destroy'])->name('incharges.destroy');

        // Records Routes
        Route::resource('records', RecordsController::class)
            ->parameters(['records' => 'record'])
            ->only(['index', 'store', 'update', 'destroy']);

        // Offices Routes
        Route::post('/offices', [OfficeController::class, 'store'])->name('offices.store');

        // Additional Records Routes
        Route::prefix('records')->name('record.')->group(function () {
            Route::get('/export', [RecordsController::class, 'exportCsv'])->name('export');
            Route::get('/stats', [RecordsController::class, 'statistics'])->name('stats');
            Route::get('/search', [RecordsController::class, 'search'])->name('search');
            Route::post('/bulk-status', [RecordsController::class, 'bulkUpdateStatus'])->name('bulk-status');
            Route::post('/bulk-delete', [RecordsController::class, 'bulkDestroy'])->name('bulk-destroy');
        });

        // File Records Routes - All protected by auth middleware
        Route::prefix('file-records')->name('file-records.')->group(function () {
            // Main index page - shows all years
            Route::get('/', [FileController::class, 'index'])->name('index');
            
            // Year detail page - shows detailed view for specific year
            Route::get('year/{year}', [FileController::class, 'showYear'])->name('year');
            
            // API/AJAX routes for data fetching
            Route::get('api/year/{year}', [FileController::class, 'getYearRecords'])->name('year-api');
            Route::get('statistics/years', [FileController::class, 'getYearsStatistics'])->name('years-stats');
            Route::get('breakdown/monthly/{year}', [FileController::class, 'getMonthlyBreakdown'])->name('monthly-breakdown');
            Route::get('breakdown/office/{year}', [FileController::class, 'getOfficeBreakdown'])->name('office-breakdown');
            Route::get('search', [FileController::class, 'search'])->name('search');
            
            // Export and archive
            Route::get('export/{year}', [FileController::class, 'export'])->name('export');
            Route::post('archive', [FileController::class, 'archive'])->name('archive');
        });

        // Profile Routes
        Route::get('/profile', [ProfileController::class, 'edit'])->name('profile.edit');
        Route::patch('/profile', [ProfileController::class, 'update'])->name('profile.update');
        Route::delete('/profile', [ProfileController::class, 'destroy'])->name('profile.destroy');
    });

    require __DIR__.'/auth.php';    