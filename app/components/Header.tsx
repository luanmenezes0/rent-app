import { Form } from "@remix-run/react";
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
                img="https://flowbite.com/docs/images/people/profile-picture-5.jpg"
                rounded={true}
              />
            }
          >
            <Dropdown.Header>
              <span className="block text-sm">{user.id}</span>
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
          <Navbar.Link href="/" active={true}>
            Clientes
          </Navbar.Link>
          <Navbar.Link href="/building-sites">Obras</Navbar.Link>
          <Navbar.Link href="/posts">Remessas</Navbar.Link>
        </Navbar.Collapse>
      </Navbar>
    </header>
  );
}
