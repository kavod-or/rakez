![rakez](docs/assets/rakez-social.png?raw=true "Rakez")

# Rakez

Rakez is a simple web app for planning staff and shifts for events.

It lets you:

- Create events, services, and positions
- Add staff and their qualified positions
- Plan shifts and assign staff
- Manage users with global, event, or service roles

## Tech stack

- Django and Django REST Framework
- React, TypeScript, and Material UI
- SQLite

## Run locally

You need Python 3.12+, Node.js, and [pnpm](https://pnpm.io/installation).

### 1. Clone the project

```bash
git clone https://github.com/kavod-or/rakez.git
cd rakez
```

### 2. Start the backend

```bash
cd backend
python3 -m venv .venv
source .venv/bin/activate
pip install Django djangorestframework django-extensions drf-spectacular
python manage.py migrate
python manage.py createsuperuser
DJANGO_SECRET_KEY=dev-key DJANGO_DEBUG=true DJANGO_SECURE_COOKIES=false DJANGO_ALLOWED_HOSTS=localhost,127.0.0.1 python manage.py runserver
```

The API runs at <http://localhost:8000>. API documentation is available at <http://localhost:8000/api/docs/>.

### 3. Give your user manager access

Open <http://localhost:8000/admin/>, sign in, and add a **Global role** for your user with the role **Global Manager**.

### 4. Start the frontend

Open another terminal:

```bash
cd rakez/frontend
pnpm install
pnpm dev
```

Open <http://localhost:5173> and sign in with the user you created.

## Tests

```bash
cd backend
DJANGO_SECRET_KEY=test-key .venv/bin/python manage.py test accounts scheduling staffing availability
```

```bash
cd frontend
pnpm build
```

## License

Rakez is licensed under the [GNU Affero General Public License v3.0](LICENSE).
