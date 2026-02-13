<?php

namespace App\Http\Controllers;

use App\Models\Incharge;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;
use Inertia\Inertia;

class InchargeController extends Controller
{
    /**
     * Display a listing of the resource.
     */
    public function index()
    {
        $incharges = Incharge::orderBy('lastname')->orderBy('firstname')->get();
        
        return response()->json([
            'success' => true,
            'incharges' => $incharges
        ]);
    }

    /**
     * Store a newly created resource in storage.
     */
    public function store(Request $request)
    {
        \Log::info('Incharge store request data:', $request->all());

        DB::beginTransaction();

        try {
            $validated = $request->validate([
                'firstname' => 'required|string|max:255',
                'lastname' => 'required|string|max:255',
                'middlename' => 'nullable|string|max:255',
                'suffix' => 'nullable|string|max:50',
            ]);

            $incharge = Incharge::create($validated);

            DB::commit();

            \Log::info('Incharge created:', [
                'id' => $incharge->id,
                'name' => $incharge->firstname . ' ' . $incharge->lastname
            ]);

            // Get updated list of all incharges
            $incharges = Incharge::orderBy('lastname')->orderBy('firstname')->get();

            return redirect()->back()
                ->with('success', 'In-charge created successfully.')
                ->with('incharges', $incharges);

        } catch (\Illuminate\Validation\ValidationException $e) {
            DB::rollBack();
            \Log::error('Incharge validation error:', $e->errors());
            return back()
                ->withErrors($e->errors())
                ->withInput()
                ->with('error', 'Validation failed. Please check your input.');
        } catch (\Exception $e) {
            DB::rollBack();
            \Log::error('Incharge store error: ' . $e->getMessage());
            return redirect()->back()
                ->with('error', 'Failed to create in-charge: ' . $e->getMessage())
                ->withInput();
        }
    }

    /**
     * Update the specified resource in storage.
     */
    public function update(Request $request, Incharge $incharge)
    {
        \Log::info('Incharge update request data:', $request->all());

        DB::beginTransaction();

        try {
            $validated = $request->validate([
                'firstname' => 'required|string|max:255',
                'lastname' => 'required|string|max:255',
                'middlename' => 'nullable|string|max:255',
                'suffix' => 'nullable|string|max:50',
            ]);

            $incharge->update($validated);

            DB::commit();

            // Get updated list of all incharges
            $incharges = Incharge::orderBy('lastname')->orderBy('firstname')->get();

            return redirect()->back()
                ->with('success', 'In-charge updated successfully.')
                ->with('incharges', $incharges);

        } catch (\Illuminate\Validation\ValidationException $e) {
            DB::rollBack();
            \Log::error('Incharge update validation error:', $e->errors());
            return back()
                ->withErrors($e->errors())
                ->withInput()
                ->with('error', 'Validation failed. Please check your input.');
        } catch (\Exception $e) {
            DB::rollBack();
            \Log::error('Incharge update error: ' . $e->getMessage());
            return redirect()->back()
                ->with('error', 'Failed to update in-charge: ' . $e->getMessage())
                ->withInput();
        }
    }

    /**
     * Remove the specified resource from storage.
     */
    public function destroy(Incharge $incharge)
    {
        DB::beginTransaction();

        try {
            $incharge->delete();
            
            DB::commit();

            // Get updated list of all incharges
            $incharges = Incharge::orderBy('lastname')->orderBy('firstname')->get();

            return redirect()->back()
                ->with('success', 'In-charge deleted successfully.')
                ->with('incharges', $incharges);

        } catch (\Exception $e) {
            DB::rollBack();
            \Log::error('Incharge delete error: ' . $e->getMessage());
            return redirect()->back()
                ->with('error', 'Failed to delete in-charge: ' . $e->getMessage());
        }
    }
}