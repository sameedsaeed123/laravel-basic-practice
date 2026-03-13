<!DOCTYPE html>
<html>
<head>
    <meta charset="utf-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Order Confirmation</title>
</head>
<body style="font-family: sans-serif; line-height: 1.6; color: #333; max-width: 600px; margin: 0 auto; padding: 20px;">
    <h1 style="font-size: 1.5rem; margin-bottom: 1rem;">Order Confirmation</h1>
    <p>Thank you for your order.</p>
    <p><strong>Order #{{ $order->id }}</strong></p>
    <p>Amount: ${{ number_format($order->amount, 2) }}</p>
    <p>Status: {{ $order->status }}</p>
    @if($order->items && $order->items->count() > 0)
    <table style="width: 100%; border-collapse: collapse; margin: 1rem 0;">
        <thead>
            <tr style="background: #f5f5f5;">
                <th style="text-align: left; padding: 8px; border: 1px solid #ddd;">Product</th>
                <th style="text-align: right; padding: 8px; border: 1px solid #ddd;">Qty</th>
                <th style="text-align: right; padding: 8px; border: 1px solid #ddd;">Price</th>
            </tr>
        </thead>
        <tbody>
            @foreach($order->items as $item)
            <tr>
                <td style="padding: 8px; border: 1px solid #ddd;">{{ $item->product ? $item->product->title : 'Product #' . $item->product_id }}</td>
                <td style="text-align: right; padding: 8px; border: 1px solid #ddd;">{{ $item->quantity }}</td>
                <td style="text-align: right; padding: 8px; border: 1px solid #ddd;">${{ number_format($item->price, 2) }}</td>
            </tr>
            @endforeach
        </tbody>
    </table>
    @endif
    <p>If you have any questions, please contact us.</p>
</body>
</html>
