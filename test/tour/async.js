const hello=async(w)=>{return prn("hello",w)
}
await hello("world")
await hello("earth")
const ps=[Promise.resolve(1),Promise.resolve(2),]

for await(let v of ps){prn("for@",v)
}
