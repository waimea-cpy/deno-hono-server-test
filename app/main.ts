import { Hono, type Context } from 'jsr:@hono/hono'
import { html, raw } from 'jsr:@hono/hono/html'
import { serveStatic } from 'jsr:@hono/hono/deno'
import { DB } from "https://deno.land/x/sqlite@v3.9.1/mod.ts"
import type { HtmlEscapedString } from "jsr:@hono/hono/utils/html";
import { Eta } from "jsr:@eta-dev/eta";


// Open a database
const db = new DB('db/test.db');

// Setup template engine
const viewPath = Deno.cwd()+'/views/'
const eta = new Eta({ views: viewPath, cache: true })


// Page header component
const Header = (title: string) => html`
    <header>
        <h1>${title}</h1>
    </header>
`

// Page nav component
const Nav = () => html`
    <nav>
        <a href="/">Home</a>
        <a href="/hello">Hello</a>
        <a href="/users">Users</a>
    </nav>
`

// Page footer component
const Footer = () => html`
    <footer>
        &copy; 2024
    </footer>
`

// Default page layout
const Layout = (
    title: string,
    content: HtmlEscapedString | Promise<HtmlEscapedString> = html``
) => html`
    <html>
        <head>
            <meta charset="UTF-8">
            <title>${title}</title>
        </head>

        <body>
            ${Header(title)}

            ${Nav()}

            ${content}

            ${Footer()}
        </body>
    </html>
`

// Create new routing engine
const app = new Hono()

// Home page
app.get('/', (c: Context) => {
    return c.html(
        Layout('Hello, World!')
    )
})

// Hello page
app.get('/hello', (c: Context) => {
    return c.html(
        Layout(
            'Hello, Hono!',
            html`<img src="/static/hono.png">`
        )
    )
})

// All users
app.get('/users', (c: Context) => {
    const records = db.query('SELECT id, name FROM people')
    console.log(records)

    let response = ``
    for (const [id, name] of records) {
        response += `
            <li>
                <a href="/users/${id}">
                    ${name}
                </a>
            </li>
            `
    }

    return c.html(
        Layout(
            'All Users',
            html`
                <ul>
                    ${raw(response)}
                </ul>
            `
        )
    )
})

// Specific single user (via id)
app.get('/users/:id', (c: Context) => {
    const id = c.req.param('id')

    const records = db.query('SELECT id, name FROM people WHERE id=?', [id])
    console.log(records)

    if (records.length > 0) {
        const [id, name] = records[0]
        return c.html(
            Layout(
                'User Details',
                html`
                    Id: ${id}<br>
                    User: ${name}
                `
            )
        )
    }
    else {
        return c.html('User not found', 404)
    }
})

// All static files (e.g. images / css)
app.use('/static/*', serveStatic({ root: Deno.cwd() }))


// Launch server
Deno.serve(app.fetch)
