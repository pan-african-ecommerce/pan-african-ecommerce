export default {
  async fetch(request, env) {
    if (request.method !== 'POST') {
      return new Response('Method not allowed', { status: 405 });
    }

    let payload;
    try {
      payload = await request.json();
    } catch (e) {
      return new Response('Invalid JSON', { status: 400 });
    }

    const {
      rfq_id,
      product_description,
      quantity,
      quantity_unit,
      target_delivery_date,
      message,
      buyer_name,
      buyer_email,
      provider_email
    } = payload;

    if (!provider_email) {
      return new Response('Missing provider_email', { status: 400 });
    }

    const subject = 'New RFQ from ACE Production Exchange';
    const body = [
      'You have received a new request for quote on ACE Production Exchange.',
      '',
      'Product or service: ' + (product_description || 'Not provided'),
      quantity ? 'Quantity: ' + quantity + ' ' + (quantity_unit || '') : null,
      target_delivery_date ? 'Target delivery date: ' + target_delivery_date : null,
      '',
      'Buyer: ' + (buyer_name || 'Anonymous'),
      buyer_email ? 'Buyer email: ' + buyer_email : null,
      '',
      message ? 'Buyer message:\n' + message : null,
      '',
      'RFQ ID: ' + (rfq_id || 'not provided'),
      '',
      'Sign in to your ACE provider dashboard to reply:',
      'https://ancient-bush-828b.mkm-f19.workers.dev/provider-dashboard.html'
    ].filter(line => line !== null).join('\n');

    const resendResp = await fetch('https://api.resend.com/emails', {
      method: 'POST',
      headers: {
        'Authorization': 'Bearer ' + env.RESEND_API_KEY,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        from: 'ACE Production Exchange <onboarding@resend.dev>',
        to: [provider_email],
        subject: subject,
        text: body
      })
    });

    if (!resendResp.ok) {
      const errText = await resendResp.text();
      return new Response('Resend error: ' + errText, { status: 502 });
    }

    const resendData = await resendResp.json();
    return new Response(JSON.stringify({ ok: true, id: resendData.id }), {
      status: 200,
      headers: { 'Content-Type': 'application/json' }
    });
  }
};
