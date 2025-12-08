import { Hono } from 'hono'

const app = new Hono()

export default app.get('/', (c) => {

   // console.log('yo!!!!');
    return c.text('Hello Kaido!')
})


