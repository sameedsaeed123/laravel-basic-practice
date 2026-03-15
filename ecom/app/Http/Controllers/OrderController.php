<?php

namespace App\Http\Controllers;

use App\Models\Order;
use App\Traits\ApiResponse;

class OrderController extends Controller
{
    use ApiResponse;

    public function index()
    {
        $orders = Order::with(['items.product', 'user'])->orderBy('id', 'desc')->get();
        return $this->success($orders, 'Orders retrieved successfully.');
    }

    public function show($id)
    {
        $order = Order::with(['items.product', 'user'])->findOrFail($id);
        return $this->success($order, 'Order retrieved successfully.');
    }

    public function updateStatus($id, \Illuminate\Http\Request $request)
    {
        $request->validate([
            'status' => 'required|string|in:paid,processing,shipped,delivered,cancelled',
        ]);

        $order = Order::findOrFail($id);
        $order->update(['status' => $request->status]);

        return $this->success(
            $order->load(['items.product', 'user']),
            'Order status updated successfully.'
        );
    }
}
