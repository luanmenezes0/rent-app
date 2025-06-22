# Construction Equipment Rental Management App

A modern web application for managing construction equipment rentals, with a focus on scaffolding and other construction tools. This app helps rental businesses streamline their operations, track equipment, manage customers, and handle rental agreements efficiently.

## Features

- **Equipment Management**
  - Track scaffolding and construction equipment inventory
  - Monitor equipment condition and maintenance schedules
  - Manage equipment availability and reservations
  - Track equipment location and status

- **Customer Management**
  - Customer profiles and rental history
  - Contact information and communication logs
  - Payment history and outstanding balances
  - Customer agreements and contracts

- **Rental Operations**
  - Create and manage rental agreements
  - Track rental periods and returns
  - Calculate rental fees and deposits
  - Generate invoices and receipts
  - Handle equipment check-in/check-out

- **Reporting & Analytics**
  - Revenue reports and financial tracking
  - Equipment utilization statistics
  - Customer rental patterns
  - Maintenance and repair history

## Tech Stack

- [React router](https://reactrouter.com/) - Full-stack web framework
- [SQLite](https://sqlite.org) - Production-ready database
- [Prisma](https://prisma.io) - Database ORM
- [Tailwind CSS](https://tailwindcss.com/) - Styling
- [TypeScript](https://typescriptlang.org) - Type safety
- [Fly.io](https://fly.io) - Deployment platform
- [GitHub Actions](https://github.com/features/actions) - CI/CD

## Development

1. Clone the repository
2. Install dependencies:
   ```sh
   npm install
   ```
3. Set up the database:
   ```sh
   npm run setup
   ```
4. Start the development server:
   ```sh
   npm run dev
   ```

## Testing

The app includes comprehensive testing:

- End-to-end tests with Cypress
- Unit tests with Vitest
- Type checking with TypeScript
- Linting with ESLint
- Code formatting with Prettier

Run tests with:
```sh
npm test
```

## Deployment

The app is configured for deployment on Fly.io with automatic deployments through GitHub Actions:

- Production: Deploys on merge to `main`
- Staging: Deploys on merge to `dev`

## Contributing

1. Fork the repository
2. Create your feature branch
3. Commit your changes
4. Push to the branch
5. Create a Pull Request

## License

This project is licensed under the MIT License - see the LICENSE file for details.
