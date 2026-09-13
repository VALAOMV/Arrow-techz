function checkBooking() {
    var date = document.getElementById("bookingDate").value;
    var timeSelected = document.querySelector('input[name="slot"]:checked');

    if (!date || !timeSelected) {
        document.getElementById("warning").style.display = "block";
    } else {
        document.getElementById("warning").style.display = "none";
        window.location.href = "consultation.html"; // your original link
    }
}