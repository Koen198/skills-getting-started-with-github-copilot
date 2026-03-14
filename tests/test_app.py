import pytest
import copy
from fastapi.testclient import TestClient
from src.app import app, activities as global_activities

# Create a deep copy of the initial activities for resetting
initial_activities = copy.deepcopy(global_activities)

@pytest.fixture(autouse=True)
def reset_activities():
    """Reset the global activities dict before each test to ensure isolation."""
    global_activities.clear()
    global_activities.update(copy.deepcopy(initial_activities))

# Create a test client
client = TestClient(app)

def test_get_activities():
    """Test GET /activities returns all activities with status 200."""
    # Arrange: Activities are reset by fixture

    # Act
    response = client.get("/activities")

    # Assert
    assert response.status_code == 200
    data = response.json()
    assert isinstance(data, dict)
    assert len(data) > 0  # Assuming there are activities
    assert "Chess Club" in data
    assert data == global_activities

def test_signup_success():
    """Test successful signup for an existing activity."""
    # Arrange
    activity_name = "Chess Club"
    email = "student@example.com"

    # Act
    response = client.post(f"/activities/{activity_name}/signup", params={"email": email})

    # Assert
    assert response.status_code == 200
    assert response.json() == {"message": f"Signed up {email} for {activity_name}"}
    assert email in global_activities[activity_name]["participants"]

def test_signup_non_existent_activity():
    """Test signup for a non-existent activity returns 404."""
    # Arrange
    activity_name = "NonExistent"
    email = "student@example.com"

    # Act
    response = client.post(f"/activities/{activity_name}/signup", params={"email": email})

    # Assert
    assert response.status_code == 404
    assert response.json() == {"detail": "Activity not found"}

def test_signup_duplicate():
    """Test signing up the same email twice returns 400."""
    # Arrange
    activity_name = "Chess Club"
    email = "student@example.com"
    client.post(f"/activities/{activity_name}/signup", params={"email": email})  # First signup

    # Act
    response = client.post(f"/activities/{activity_name}/signup", params={"email": email})

    # Assert
    assert response.status_code == 400
    assert response.json() == {"detail": "Student already signed up for this activity"}

def test_unregister_success():
    """Test successful unregistration from an activity."""
    # Arrange
    activity_name = "Chess Club"
    email = "student@example.com"
    client.post(f"/activities/{activity_name}/signup", params={"email": email})  # Signup first

    # Act
    response = client.delete(f"/activities/{activity_name}/participants", params={"email": email})

    # Assert
    assert response.status_code == 200
    assert response.json() == {"message": f"Removed {email} from {activity_name}"}
    assert email not in global_activities[activity_name]["participants"]

def test_unregister_non_existent_activity():
    """Test unregistering from a non-existent activity returns 404."""
    # Arrange
    activity_name = "NonExistent"
    email = "student@example.com"

    # Act
    response = client.delete(f"/activities/{activity_name}/participants", params={"email": email})

    # Assert
    assert response.status_code == 404
    assert response.json() == {"detail": "Activity not found"}

def test_unregister_not_signed_up():
    """Test unregistering an email not signed up returns 404."""
    # Arrange
    activity_name = "Chess Club"
    email = "student@example.com"

    # Act
    response = client.delete(f"/activities/{activity_name}/participants", params={"email": email})

    # Assert
    assert response.status_code == 404
    assert response.json() == {"detail": "Participant not found"}