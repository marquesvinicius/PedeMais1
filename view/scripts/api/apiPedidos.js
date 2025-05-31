import { BASE_URL } from '../config.js'

export async function buscarPedidos() {
  const token = localStorage.getItem('token')
  const response = await fetch(`${BASE_URL}/api/pedidos`, {
    headers: { Authorization: `Bearer ${token}` }
  })
  const data = await response.json()
  return data.pedidos || []
}

export async function buscarPedidoPorId(id) {
  const token = localStorage.getItem('token')
  const response = await fetch(`${BASE_URL}/api/pedidos/${id}`, {
    headers: { Authorization: `Bearer ${token}` }
  })
  
  if (!response.ok) {
    throw new Error('Pedido não encontrado')
  }
  
  const data = await response.json()
  return data.pedido || data
}

export async function atualizarStatusPedido(id, novoStatus) {
  const token = localStorage.getItem('token')
  const response = await fetch(`${BASE_URL}/api/pedidos/${id}`, {
    method: 'PATCH',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${token}`
    },
    body: JSON.stringify({ status: novoStatus })
  })
  
  if (!response.ok) {
    throw new Error('Erro ao atualizar status do pedido')
  }
  
  return await response.json()
}

export async function excluirPedido(id) {
  const token = localStorage.getItem('token')
  const response = await fetch(`${BASE_URL}/api/pedidos/${id}`, {
    method: 'DELETE',
    headers: { Authorization: `Bearer ${token}` }
  })
  
  if (!response.ok) {
    throw new Error('Erro ao excluir pedido')
  }
  
  return await response.json()
}

export async function filtrarPedidosPorStatus(pedidos, status) {
  return status === '' ? pedidos : pedidos.filter(p => p.status === status)
}

export async function filtrarPedidosPorMesa(pedidos, mesa) {
  return mesa === '' ? pedidos : pedidos.filter(p => p.mesa.toString() === mesa)
}

export async function criarPedido(pedido) {
  const token = localStorage.getItem('token')

  const response = await fetch(`${BASE_URL}/api/pedidos`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${token}`
    },
    body: JSON.stringify(pedido)
  })

  const data = await response.json()

  if (!response.ok) throw new Error(data.erro || 'Erro ao criar pedido.')
  return data
}

export async function buscarItensPedido(pedidoId) {
  const token = localStorage.getItem('token')
  const response = await fetch(`${BASE_URL}/api/pedidos/${pedidoId}/itens`, {
    headers: { Authorization: `Bearer ${token}` }
  })
  
  if (!response.ok) {
    return []
  }
  
  const data = await response.json()
  return data.itens || []
}
