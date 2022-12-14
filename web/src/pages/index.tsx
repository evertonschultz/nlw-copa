import Head from 'next/head'
import Image from 'next/image'
import { FormEvent, useState } from 'react';
import { getSession, signOut } from 'next-auth/react';
import { GetServerSideProps } from 'next';

interface UserAvatarProps {
  id: string;
  name: string;
  avatarUrl: string
}

interface HomePros {
  poolCount: number;
  guessCount: number;
  userCount: number;
  usersAvatar: UserAvatarProps[],
  accessToken: string
}

import appNlwCopa from '../assets/app-nlw-copa.png'
import logoImg from '../assets/logo.svg'
import iconCheck from '../assets/icon-check.svg'
import { api } from '../lib/axios';

export default function Home(props: HomePros) {
  const [poolTitle, setPoolTitle] = useState('')

  async function createPool(event: FormEvent) {
    event.preventDefault()

    try {
      const tokenResponse = await api.post('/users', { access_token: props.accessToken })
      api.defaults.headers.common['Authorization'] = `Bearer ${tokenResponse.data.token}`
      
      const response = await api.post('/pools', {
        title: poolTitle,
      })

      const { code } = response.data

      await navigator.clipboard.writeText(code)

      alert(`Bolão criado com sucessso, o código - ${code} - foi copiado para sua área de tranferência!`)
    } catch (error) {
      console.log(error)
      alert('Falha ao criar o bolão, faça seu login e tente novamente!')
      signOut()
    } finally {
      setPoolTitle('')
    }
  }

  return (
    <>
      <Head>
        <title>NLW COPA</title>
        <meta name="description" content="Generated by create next app" />
        <link rel="icon" href="/favicon.ico" />
      </Head>
      
      <div className="max-w-[1124px] h-screen mx-4 gap-28 flex lg:mx-auto lg:grid lg:grid-cols-2 items-center">
        <main>
          <div className="flex flex-1 justify-between items-center">
            <Image src={logoImg} alt="NLW Copa" />
            <button className="bg-gray-800 rounded px-3 py-1 text-yellow-500" onClick={() => signOut()} >Sair</button>
          </div>

          <h1 className="mt-14 text-white text-5xl font-bold leading-tight">
            Crie seu próprio bolão da copa e compartilhe entre amigos!
          </h1>

          <div className="mt-10 flex items-center gap-2">
            <div className="flex -space-x-4">
              {
                props.usersAvatar.map(user => (
                  <Image
                    width={52}
                    height={52}
                    className="w-14 h-14 rounded-full border-4 border-gray-900"
                    key={user.id}
                    src={user.avatarUrl}
                    alt={user.name} />
                ))
              }
            </div>
            <strong className="text-gray-100 text-xl">
              <span className="text-ignite-500">+{props.userCount}</span> pessoas já estão usando
            </strong>
          </div>

          <form onSubmit={createPool} className="mt-10 flex gap-2">
            <input
              className="flex-1 px-6 py-4 rounded bg-gray-800 border border-gray-600 text-sm text-gray-100"
              type="text"
              required
              placeholder='Qual nome do seu bolão?'
              onChange={event => setPoolTitle(event.target.value)}
              value={poolTitle}
            />
            <button
              className="px-6 py-4 rounded bg-yellow-500 text-gray-900 font-bold text-sm uppercase hover:bg-yellow-700"
              type='submit'
            >
              Criar meu bolão
            </button>
          </form>

          <p className="mt-4 text-sm text-gray-300 leading-relaxed">
            Após criar seu bolão, você receberá um código único que poderá usar para convidar outras pessoas 🚀
          </p>

          <div className="mt-10 pt-10 border-t border-gray-600 flex items-center justify-between text-gray-100">
            <div className="flex items-center gap-3 md:gap-6">
              <Image src={iconCheck} alt="" />
              <div className="flex flex-col">
                <span className="font-bold text-2xl">+{props.poolCount}</span>
                <span>Bolões criados</span>
              </div>
            </div>

            <div className="w-px h-14 bg-gray-600" />

            <div className="flex items-center gap-3 md:gap-6">
              <Image src={iconCheck} alt="" />
              <div className="flex flex-col">
                <span className="font-bold text-2xl">+{props.guessCount}</span>
                <span>Palpites enviados</span>
              </div>
            </div>
          </div>
        </main>
        <Image
          src={appNlwCopa}
          alt="Dois celulares exibindo uma prévia da aplicação móvel do NLW Copa"
          quality={100}
          className="hidden lg:flex"
        />
      </div>
    </>
  )
}

export const getServerSideProps: GetServerSideProps = async (context) => {
  const session = await getSession(context)

  if(!session) {
    return {
      redirect: {
        destination: '/login',
        permanent: false
      }
    }
  }

  const [
    poolCountResponse,
    guessCountResponse,
    userCountResponse,
    usersAvatarResponse
  ] = await Promise.all([
    api.get('pools/count'),
    api.get('guesses/count'),
    api.get('users/count'),
    api.get('users')
  ])

  return {
    props: {
      poolCount: poolCountResponse.data.count,
      guessCount: guessCountResponse.data.count,
      userCount: userCountResponse.data.count,
      usersAvatar: usersAvatarResponse.data.users,
      accessToken: session.accessToken,
    }
  }
}
