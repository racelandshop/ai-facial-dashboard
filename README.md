# HACS Frontend

This repository holds the frontend files of the camera dashboard

For developement download the hacs repo and run in development mode:

```
hacs:
  token: [token]
  frontend_repo_url: http://localhost:5000
```

Replace token with A Github Personal Access Token and change localhost:5000 for the IP of your devserver if not the same. Make sure that your Home Assistant instance can access provided URL. If development frontend isn't hosted on the same device as HA it can't be accessed with localhost.
