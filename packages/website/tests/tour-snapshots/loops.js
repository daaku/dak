
{let i=5
while(i>0){prn("while:",(i--))
}
}

for(let i=0
i<5
i++){prn("for step=1",i)
}

for(let i=0
i<10
i+=2){prn("for step=2",i)
}

const vs=["a","b","c",]

for(let v of vs){prn("for-of:",v)
}

const os=[{name:"yoda",age:900,},{name:"luke",age:90,},]

for(let {name,age} of os){prn(name,"is",age,"years old")
}

const yoda={name:"yoda",age:900,}

for(let p in yoda){prn(p,yoda[p])
}

const ps=[Promise.resolve(1),Promise.resolve(2),]

for await(let v of ps){prn("for@",v)
}

for(let i=0
i<5
i++){prn("breaking",i)
break
}

for(let i=0
i<5
i++){if((i%2)===0){prn("even",i)}else{continue}
}
