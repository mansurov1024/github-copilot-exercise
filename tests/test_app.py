import copy

from fastapi.testclient import TestClient

from src.app import activities, app

client = TestClient(app)

INITIAL_ACTIVITIES = {
    "Chess Club": {
        "description": "Learn strategies and compete in chess tournaments",
        "schedule": "Fridays, 3:30 PM - 5:00 PM",
        "max_participants": 12,
        "participants": ["michael@mergington.edu", "daniel@mergington.edu"]
    },
    "Programming Class": {
        "description": "Learn programming fundamentals and build software projects",
        "schedule": "Tuesdays and Thursdays, 3:30 PM - 4:30 PM",
        "max_participants": 20,
        "participants": ["emma@mergington.edu", "sophia@mergington.edu"]
    },
    "Gym Class": {
        "description": "Physical education and sports activities",
        "schedule": "Mondays, Wednesdays, Fridays, 2:00 PM - 3:00 PM",
        "max_participants": 30,
        "participants": ["john@mergington.edu", "olivia@mergington.edu"]
    },
    "Basketball Team": {
        "description": "Practice and compete in basketball games",
        "schedule": "Tuesdays and Thursdays, 4:00 PM - 6:00 PM",
        "max_participants": 15,
        "participants": []
    },
    "Soccer Club": {
        "description": "Train and play soccer matches",
        "schedule": "Wednesdays and Saturdays, 3:00 PM - 5:00 PM",
        "max_participants": 22,
        "participants": []
    },
    "Art Club": {
        "description": "Explore painting, drawing, and other visual arts",
        "schedule": "Mondays, 3:30 PM - 5:00 PM",
        "max_participants": 18,
        "participants": []
    },
    "Drama Club": {
        "description": "Act in plays and learn theatrical skills",
        "schedule": "Tuesdays, 4:00 PM - 5:30 PM",
        "max_participants": 20,
        "participants": []
    },
    "Debate Club": {
        "description": "Develop argumentation and public speaking skills",
        "schedule": "Thursdays, 3:30 PM - 4:30 PM",
        "max_participants": 16,
        "participants": []
    },
    "Science Club": {
        "description": "Conduct experiments and explore scientific concepts",
        "schedule": "Fridays, 4:00 PM - 5:30 PM",
        "max_participants": 14,
        "participants": []
    }
}


def reset_activities():
    activities.clear()
    activities.update(copy.deepcopy(INITIAL_ACTIVITIES))


def test_get_activities_returns_full_list():
    # Arrange
    reset_activities()

    # Act
    response = client.get("/activities")

    # Assert
    assert response.status_code == 200
    assert response.json() == activities


def test_root_redirects_to_static_index():
    # Arrange
    reset_activities()

    # Act
    response = client.get("/", follow_redirects=False)

    # Assert
    assert response.status_code == 307
    assert response.headers["location"] == "/static/index.html"


def test_signup_for_activity_adds_participant():
    # Arrange
    reset_activities()
    activity_name = "Basketball Team"
    new_email = "newstudent@mergington.edu"

    # Act
    response = client.post(f"/activities/{activity_name}/signup", params={"email": new_email})

    # Assert
    assert response.status_code == 200
    assert response.json() == {"message": f"Signed up {new_email} for {activity_name}"}
    assert new_email in activities[activity_name]["participants"]


def test_signup_for_missing_activity_returns_404():
    # Arrange
    reset_activities()

    # Act
    response = client.post("/activities/Nonexistent/signup", params={"email": "student@mergington.edu"})

    # Assert
    assert response.status_code == 404
    assert response.json()["detail"] == "Activity not found"


def test_duplicate_signup_returns_400():
    # Arrange
    reset_activities()
    activity_name = "Chess Club"
    existing_email = "michael@mergington.edu"

    # Act
    response = client.post(f"/activities/{activity_name}/signup", params={"email": existing_email})

    # Assert
    assert response.status_code == 400
    assert response.json()["detail"] == "Email already signed up for this activity"


def test_remove_participant_from_activity():
    # Arrange
    reset_activities()
    activity_name = "Gym Class"
    email_to_remove = "john@mergington.edu"

    # Act
    response = client.delete(f"/activities/{activity_name}/participants", params={"email": email_to_remove})

    # Assert
    assert response.status_code == 200
    assert response.json() == {"message": f"Unregistered {email_to_remove} from {activity_name}"}
    assert email_to_remove not in activities[activity_name]["participants"]


def test_remove_participant_from_missing_activity_returns_404():
    # Arrange
    reset_activities()

    # Act
    response = client.delete("/activities/Nonexistent/participants", params={"email": "student@mergington.edu"})

    # Assert
    assert response.status_code == 404
    assert response.json()["detail"] == "Activity not found"


def test_remove_unregistered_email_returns_400():
    # Arrange
    reset_activities()
    activity_name = "Basketball Team"
    unregistered_email = "notregistered@mergington.edu"

    # Act
    response = client.delete(f"/activities/{activity_name}/participants", params={"email": unregistered_email})

    # Assert
    assert response.status_code == 400
    assert response.json()["detail"] == "Email not registered for this activity"
