const mockData = {
    cardapio: [
        {
            id: 1,
            nome: 'X-Burger',
            descricao: 'Hambúrguer com queijo',
            preco: 15.90,
            categoria: 'Lanches'
        }
    ]
}

const supabaseMock = {
    from: (table) => ({
        select: () => ({
            order: () => ({
                data: mockData[table] || [],
                error: null
            })
        }),
        insert: (data) => ({
            select: () => ({
                data: data,
                error: null
            })
        }),
        update: (data) => ({
            eq: () => ({
                select: () => ({
                    data: data,
                    error: null
                })
            })
        }),
        delete: () => ({
            eq: () => ({
                data: null,
                error: null
            })
        })
    })
}

module.exports = { supabaseMock } 