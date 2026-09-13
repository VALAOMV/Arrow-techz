// checkout.js
document.addEventListener("DOMContentLoaded", () => {
  const payBtn = document.getElementById("pay-btn");

  // ensure these input fields exist in your HTML:
  // <input id="name" />
  // <input id="email" />
  payBtn.addEventListener("click", async (e) => {
    e.preventDefault();

    const name = document.getElementById("name").value?.trim();
    const email = document.getElementById("email").value?.trim();
    const gateway = document.querySelector('input[name="gateway"]:checked')?.value || "razorpay";

    if (!name || !email) {
      alert("Please enter name and email to proceed.");
      return;
    }

    if (gateway === "razorpay") {
      // Step 1: ask backend to create Razorpay order
      const createRes = await fetch("http://localhost:3000/create-razor-order", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ amount: 50000 }) // amount in paise (₹500)
      });

      if (!createRes.ok) {
        const err = await createRes.json().catch(()=>({error:"Create order failed"}));
        alert("Order creation failed: " + (err.error || createRes.statusText));
        return;
      }

      const orderData = await createRes.json();

      // Step 2: open Razorpay checkout
      const options = {
        "key": orderData.key_id, // from server
        "amount": orderData.amount,
        "currency": orderData.currency || "INR",
        "name": "Arrow Techz",
        "description": "Payment for Arrow Techz",
        "order_id": orderData.order_id,
        "handler": async function (response) {
          // response contains razorpay_payment_id, razorpay_order_id, razorpay_signature
          // Step 3: send the payment + user info to backend to verify and create user
          const completeRes = await fetch("http://localhost:3000/complete-payment", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
              gateway: "razorpay",
              payment: response,
              user: { name, email }
            })
          });

          const result = await completeRes.json().catch(()=>({ error: "No JSON response" }));

          if (completeRes.ok) {
            alert("Payment verified and account created. You can now login.");
            // redirect to login / dashboard as you prefer:
            window.location.href = "/login.html";
          } else {
            alert("Verification failed: " + (result.error || "Unknown"));
          }
        },
        "prefill": {
          name,
          email
        },
        "theme": {
          "color": "#528FF0"
        }
      };

      const rzp = new Razorpay(options);
      rzp.open();
    } else if (gateway === "cashfree") {
      // If you want Cashfree flow: create an order on backend then redirect
      // Keep similar steps: after success, call /complete-payment with gateway: "cashfree"
      // For brevity not repeating full Cashfree flow here.
      alert("Cashfree flow: not implemented in this snippet. Use Razorpay flow for now.");
    }
  });
});
