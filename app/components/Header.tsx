import { Form, NavLink } from "@remix-run/react";
import { Avatar, Dropdown, Navbar } from "flowbite-react";
import { useUser } from "~/utils";

export default function Header() {
  const user = useUser();

  return (
    <header className="bg-slate-800 text-white">
      <Navbar fluid={true}>
        <Navbar.Brand href="/">
          <img
            src="https://flowbite.com/docs/images/logo.svg"
            className="mr-3 h-6 sm:h-9"
            alt="Flowbite Logo"
          />
          <span className="self-center whitespace-nowrap text-xl font-semibold text-slate-800 dark:text-white">
            App
          </span>
        </Navbar.Brand>
        <div className="flex md:order-2">
          <Dropdown
            arrowIcon={false}
            inline={true}
            label={
              <Avatar
                alt="User settings"
                img="https://k2partnering.com/wp-content/uploads/2016/05/Person.jpg"
                rounded
              />
            }
          >
            <Dropdown.Header>
              <span className="block truncate text-sm font-medium">
                {user.email}
              </span>
            </Dropdown.Header>
            <Dropdown.Item>
              <Form action="/logout" method="post" className="w-full text-left">
                <button type="submit" className="w-full">
                  Sair
                </button>
              </Form>
            </Dropdown.Item>
          </Dropdown>
          <Navbar.Toggle />
        </div>
        <Navbar.Collapse>
          <NavLink
            to="/"
            style={({ isActive }) =>
              isActive ? { color: "blue" } : { color: "black" }
            }
          >
            Início
          </NavLink>
          <NavLink
            to="/clients"
            style={({ isActive }) =>
              isActive ? { color: "blue" } : { color: "black" }
            }
          >
            Clientes
          </NavLink>
          <NavLink
            to="/building-sites"
            style={({ isActive }) =>
              isActive ? { color: "blue" } : { color: "black" }
            }
          >
            Obras
          </NavLink>
          <NavLink
            to="/posts"
            style={({ isActive }) =>
              isActive ? { color: "blue" } : { color: "black" }
            }
          >
            Remessas
          </NavLink>
        </Navbar.Collapse>
      </Navbar>
    </header>
  );
}
