// Distance-based cadence: collisions and mid-air movement cannot produce footsteps.
export function createGait(){
  let distance=0,airborne=false;
  return {
    reset(){distance=0;airborne=false;},
    update(travel,height,running){
      if(height>0){airborne=true;distance=0;return null;}
      if(airborne){airborne=false;distance=0;return 'land';}
      if(travel<.0001)return null;
      distance+=travel;
      const stride=running?1.25:1.05;
      if(distance>=stride){distance%=stride;return 'step';}
      return null;
    }
  };
}

export function createFootsteps(context,echo){
  const output=context.createGain();output.gain.value=1;output.connect(context.destination);
  const buffer=context.createBuffer(1,Math.ceil(context.sampleRate*.28),context.sampleRate);
  const data=buffer.getChannelData(0);
  for(let i=0;i<data.length;i++)data[i]=Math.random()*2-1;
  const surfaces={yellow:{cutoff:420,gain:.032,duration:.20},hospital:{cutoff:1450,gain:.024,duration:.12},pool:{cutoff:2100,gain:.022,duration:.13}};
  return {
    mute(value){output.gain.setTargetAtTime(value?0:1,context.currentTime,.025);},
    play(zone,running,landing=false){
      const surface=surfaces[zone],now=context.currentTime;
      const strength=(landing?1.55:running?1.18:1)*(.94+Math.random()*.12);
      const source=context.createBufferSource(),filter=context.createBiquadFilter(),gain=context.createGain();
      source.buffer=buffer;source.playbackRate.value=.94+Math.random()*.12;
      filter.type='lowpass';filter.frequency.value=surface.cutoff;
      gain.gain.setValueAtTime(0,now);gain.gain.linearRampToValueAtTime(surface.gain*strength,now+.009);
      gain.gain.exponentialRampToValueAtTime(.00001,now+surface.duration);
      source.connect(filter);filter.connect(gain);gain.connect(output);
      // Only tiled pool rooms send steps into the existing damped echo.
      if(zone==='pool')gain.connect(echo);
      source.start(now);source.stop(now+.27);
      source.onended=()=>{source.disconnect();filter.disconnect();gain.disconnect();};
      const heel=context.createOscillator(),heelGain=context.createGain();
      heel.frequency.setValueAtTime(landing?85:110,now);heel.frequency.exponentialRampToValueAtTime(48,now+.10);
      heelGain.gain.setValueAtTime(.009*strength,now);heelGain.gain.exponentialRampToValueAtTime(.00001,now+.13);
      heel.connect(heelGain);heelGain.connect(output);heel.start(now);heel.stop(now+.15);
      heel.onended=()=>{heel.disconnect();heelGain.disconnect();};
    }
  };
}
