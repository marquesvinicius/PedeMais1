export async function buscarPedidos() {
  const token = localStorage.getItem('token')
  const response = await fetch(`${BASE_URL}/api/pedidos`, {
    headers: { Authorization: `Bearer ${token}` }
  })
  const data = await response.json()
  return data.pedidos || []
}

export async function atualizarStatusPedido(id, novoStatus) {
  const token = localStorage.getItem('token')
  await fetch(`${BASE_URL}/api/pedidos/${id}`, {
    method: 'PATCH',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${token}`
    },
    body: JSON.stringify({ status: novoStatus })  // <- está sendo enviado corretamente?
  })

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
