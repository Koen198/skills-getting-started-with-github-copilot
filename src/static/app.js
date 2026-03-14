document.addEventListener("DOMContentLoaded", () => {
  const activitiesList = document.getElementById("activities-list");
  const activitySelect = document.getElementById("activity");
  const signupForm = document.getElementById("signup-form");
  const messageDiv = document.getElementById("message");

  // Function to unregister a participant from an activity
  async function unregisterParticipant(activity, email) {
    try {
      const response = await fetch(
        `/activities/${encodeURIComponent(activity)}/participants?email=${encodeURIComponent(email)}`,
        {
          method: "DELETE",
        }
      );

      const result = await response.json();

      if (response.ok) {
        messageDiv.textContent = result.message;
        messageDiv.className = "success";
        fetchActivities();
      } else {
        messageDiv.textContent = result.detail || "An error occurred";
        messageDiv.className = "error";
      }
    } catch (error) {
      messageDiv.textContent = "Failed to remove participant. Please try again.";
      messageDiv.className = "error";
      console.error("Error unregistering participant:", error);
    } finally {
      messageDiv.classList.remove("hidden");
      setTimeout(() => {
        messageDiv.classList.add("hidden");
      }, 5000);
    }
  }

  // Function to fetch activities from API
  async function fetchActivities() {
    try {
      const response = await fetch("/activities");
      const activities = await response.json();

      // Clear loading message and reset options
      activitiesList.innerHTML = "";
      activitySelect.innerHTML = '<option value="">-- Select an activity --</option>';

      // Populate activities list
      Object.entries(activities).forEach(([name, details]) => {
        const activityCard = document.createElement("div");
        activityCard.className = "activity-card";

        const participants = Array.isArray(details.participants) ? details.participants : [];
        const spotsLeft = details.max_participants - participants.length;
        const participantCount = participants.length;

        const titleEl = document.createElement("h4");
        titleEl.textContent = name;

        const descEl = document.createElement("p");
        descEl.textContent = details.description;

        const scheduleEl = document.createElement("p");
        scheduleEl.innerHTML = `<strong>Schedule:</strong> ${details.schedule}`;

        const availabilityEl = document.createElement("p");
        availabilityEl.innerHTML = `<strong>Availability:</strong> ${spotsLeft} spots left`;

        const participantsContainer = document.createElement("div");
        if (participantCount) {
          participantsContainer.className = "participants";

          const participantsLabel = document.createElement("p");
          participantsLabel.className = "participants-label";
          participantsLabel.innerHTML = `<strong>Participants (${participantCount}):</strong>`;

          const list = document.createElement("ul");
          list.className = "participants-list";

          participants.forEach((p) => {
            const li = document.createElement("li");

            const participantName = document.createElement("span");
            participantName.textContent = p;

            const removeBtn = document.createElement("button");
            removeBtn.type = "button";
            removeBtn.className = "participant-remove";
            removeBtn.title = "Remove participant";
            removeBtn.textContent = "✕";
            removeBtn.addEventListener("click", () => {
              unregisterParticipant(name, p);
            });

            li.appendChild(participantName);
            li.appendChild(removeBtn);
            list.appendChild(li);
          });

          participantsContainer.appendChild(participantsLabel);
          participantsContainer.appendChild(list);
        } else {
          const noParticipants = document.createElement("p");
          noParticipants.className = "no-participants";
          noParticipants.innerHTML = `<strong>Participants:</strong> No participants yet.`;
          participantsContainer.appendChild(noParticipants);
        }

        activityCard.appendChild(titleEl);
        activityCard.appendChild(descEl);
        activityCard.appendChild(scheduleEl);
        activityCard.appendChild(availabilityEl);
        activityCard.appendChild(participantsContainer);

        activitiesList.appendChild(activityCard);

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
        signupForm.reset();
        fetchActivities();
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
