const add=(a,b)=>{return (a+b)
}
prn(add(40,1))
const add_DASH_promises=async(a,b)=>{return ((await a)+(await b))
}
prn((await add_DASH_promises(Promise.resolve(40),Promise.resolve(2))))
const powers=function*(n,count){{let current=1
for(let i=0
i<count
i++){yield (current*=n)
}
}
}
for(let v of powers(2,5)){prn(v)
}
const foo=async function*(a,b){yield ((await a)+1)
return yield ((await b)+1)
}
for await(let v of foo(Promise.resolve(41),Promise.resolve(-43))){prn(v)
}
export const plus=(a,b)=>{return (a+b)
}
export default ((a,b)=>{return (a-b)
})
function TheClass(a){return this.answer=a
}
prn(new TheClass(42))
const until=(a)=>{while(true){if((a++)===42){return "boom"}
}
}
prn("returned",until(40))
const it=function*(a){yield (a++)
return yield* [(a++),(a++),]
}
for(let v of it(39)){prn("it:",v)
}
