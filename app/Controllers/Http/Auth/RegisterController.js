'use strict'

const { validateAll } = use('Validator')
const User = use('App/Models/User')
const randomString = require('random-string')
const Mail = use('Mail')

class RegisterController {
  showRegisterForm ({ view }) {
    return view.render('auth.register')
  }

  async register ({ request, session, response }) {
    // validate form inputs
    const validation = await validateAll(request.all(), {
      username: 'required|unique:users,username',
      email: 'required|email|unique:users,email',
      password: 'required'
    })

    if (validation.fails()) {
      session.withErrors(validation.messages()).flashExcept(['password'])

      return response.redirect('back')
    }

    // create user
    const user = await User.create({
      username: request.input('username'),
      email: request.input('email'),
      password: request.input('password'),
      confirmation_token: randomString({ length: 40 })
    })

    // send confirmation email
    await Mail.send('auth.emails.confirm_email', user.toJSON(), message => {
      message
        .to(user.email)
        .from('hello@adonisjs.com')
        .subject('Lütfen e-posta adresinizi doğrulayın.')
    })

    // display success message
    session.flash({
      notification: {
        type: 'Başarılı',
        message: 'Kayıt tamamlandı! E-posta adresinize bir mail gönderildi, lütfen e-posta adresinizi doğrulayın.'
      }
    })

    return response.redirect('back')
  }

  async confirmEmail ({ params, session, response }) {
    // get user with the cinfirmation token
    const user = await User.findBy('confirmation_token', params.token)

    // set confirmation to null and is_active to true
    user.confirmation_token = null
    user.is_active = true

    // persist user to database
    await user.save()

    // display success message
    session.flash({
      notification: {
        type: 'Başarılı',
        message: 'E-posta adresiniz doğrulandı.'
      }
    })

    return response.redirect('/login')
  }
}

module.exports = RegisterController