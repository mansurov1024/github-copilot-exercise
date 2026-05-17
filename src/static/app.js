document.addEventListener("DOMContentLoaded", () => {
  const activitiesList = document.getElementById("activities-list");
  const activitySelect = document.getElementById("activity");
  const signupForm = document.getElementById("signup-form");
  const messageDiv = document.getElementById("message");

  // Function to fetch activities from API
  async function fetchActivities() {
    try {
      const response = await fetch("/activities");
      const activities = await response.json();

      // Clear loading message
      activitiesList.innerHTML = "";

      // Populate activities list
      Object.entries(activities).forEach(([name, details]) => {
        const activityCard = document.createElement("div");
        activityCard.className = "activity-card";
        activityCard.dataset.activity = name;

        const spotsLeft = details.max_participants - details.participants.length;

        activityCard.innerHTML = `
          <h4>${name}</h4>
          <p>${details.description}</p>
          <p><strong>Schedule:</strong> ${details.schedule}</p>
          <p><strong>Availability:</strong> <span class="spots-left">${spotsLeft}</span> spots left</p>
        `;

        activitiesList.appendChild(activityCard);

        // Participants section
        const participantsDiv = document.createElement("div");
        participantsDiv.className = "participants";

        const participantsHeading = document.createElement("h5");
        participantsHeading.textContent = "Participants";
        participantsDiv.appendChild(participantsHeading);

        if (details.participants && details.participants.length > 0) {
          const ul = document.createElement("ul");
          details.participants.forEach((p) => {
            const li = document.createElement("li");
            li.className = "participant-item";

            const span = document.createElement("span");
            span.textContent = p;
            span.className = "participant-email";

            const removeBtn = document.createElement("button");
            removeBtn.className = "remove-participant";
            removeBtn.setAttribute("aria-label", `Remove ${p}`);
            removeBtn.textContent = "✖";

            removeBtn.addEventListener("click", async () => {
              // Confirm removal
              if (!confirm(`Remove ${p} from ${name}?`)) return;

              try {
                const resp = await fetch(
                  `/activities/${encodeURIComponent(name)}/participants?email=${encodeURIComponent(p)}`,
                  { method: "DELETE" }
                );

                const data = await resp.json();

                if (resp.ok) {
                  // Remove from UI
                  li.remove();
                  // Update spots left
                  const spotsSpan = activityCard.querySelector('.spots-left');
                  const current = parseInt(spotsSpan.textContent, 10) || 0;
                  spotsSpan.textContent = current + 1;

                  // If list becomes empty, show empty message
                  const remaining = ul.querySelectorAll('li').length;
                  if (remaining === 0) {
                    const none = document.createElement("p");
                    none.className = "no-participants";
                    none.textContent = "No participants yet";
                    participantsDiv.removeChild(ul);
                    participantsDiv.appendChild(none);
                  }
                } else {
                  alert(data.detail || 'Failed to remove participant');
                }
              } catch (err) {
                console.error('Error removing participant:', err);
                alert('Error removing participant. See console for details.');
              }
            });

            li.appendChild(span);
            li.appendChild(removeBtn);
            ul.appendChild(li);
          });
          participantsDiv.appendChild(ul);
        } else {
          const none = document.createElement("p");
          none.className = "no-participants";
          none.textContent = "No participants yet";
          participantsDiv.appendChild(none);
        }

        activityCard.appendChild(participantsDiv);

        // Add option to select dropdown
        const option = document.createElement("option");
        option.value = name;
        option.textContent = name;
        activitySelect.appendChild(option);
      });
    } catch (error) {
      activitiesList.innerHTML = "<p>Failed to load activities. Please try again later.</p>";
      console.error("Error fetching activities:", error);
    }
  }

  // Handle form submission
  signupForm.addEventListener("submit", async (event) => {
    event.preventDefault();

    const email = document.getElementById("email").value;
    const activity = document.getElementById("activity").value;

    try {
      const response = await fetch(
        `/activities/${encodeURIComponent(activity)}/signup?email=${encodeURIComponent(email)}`,
        {
          method: "POST",
        }
      );

      const result = await response.json();

      if (response.ok) {
        messageDiv.textContent = result.message;
        messageDiv.className = "success";

        // Update the activity card UI to show the new participant
        const card = document.querySelector(`.activity-card[data-activity="${activity}"]`);
        if (card) {
          const participantsDiv = card.querySelector('.participants');
          let ul = participantsDiv.querySelector('ul');
          const no = participantsDiv.querySelector('.no-participants');
          if (no) {
            no.remove();
            ul = document.createElement('ul');
            participantsDiv.appendChild(ul);
          }

          const li = document.createElement('li');
          li.className = 'participant-item';

          const span = document.createElement('span');
          span.className = 'participant-email';
          span.textContent = email;

          const removeBtn = document.createElement('button');
          removeBtn.className = 'remove-participant';
          removeBtn.setAttribute('aria-label', `Remove ${email}`);
          removeBtn.textContent = '✖';

          removeBtn.addEventListener('click', async () => {
            if (!confirm(`Remove ${email} from ${activity}?`)) return;
            try {
              const resp = await fetch(
                `/activities/${encodeURIComponent(activity)}/participants?email=${encodeURIComponent(email)}`,
                { method: 'DELETE' }
              );
              const data = await resp.json();
              if (resp.ok) {
                li.remove();
                const spotsSpan = card.querySelector('.spots-left');
                const current = parseInt(spotsSpan.textContent, 10) || 0;
                spotsSpan.textContent = current + 1;
                if (!ul.querySelector('li')) {
                  ul.remove();
                  const none = document.createElement('p');
                  none.className = 'no-participants';
                  none.textContent = 'No participants yet';
                  participantsDiv.appendChild(none);
                }
              } else {
                alert(data.detail || 'Failed to remove participant');
              }
            } catch (err) {
              console.error('Error removing participant:', err);
              alert('Error removing participant. See console for details.');
            }
          });

          li.appendChild(span);
          li.appendChild(removeBtn);
          ul.appendChild(li);

          // Decrement spots left
          const spotsSpan = card.querySelector('.spots-left');
          const currentSpots = parseInt(spotsSpan.textContent, 10) || 0;
          spotsSpan.textContent = Math.max(0, currentSpots - 1);
        }

        signupForm.reset();
      } else {
        messageDiv.textContent = result.detail || "An error occurred";
        messageDiv.className = "error";
      }

      messageDiv.classList.remove("hidden");

      // Hide message after 5 seconds
      setTimeout(() => {
        messageDiv.classList.add("hidden");
      }, 5000);
    } catch (error) {
      messageDiv.textContent = "Failed to sign up. Please try again.";
      messageDiv.className = "error";
      messageDiv.classList.remove("hidden");
      console.error("Error signing up:", error);
    }
  });

  // Initialize app
  fetchActivities();
});
