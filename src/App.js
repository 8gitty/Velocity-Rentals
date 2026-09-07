import React, { useState, useEffect } from 'react';
import './App.css';

// --- INITIAL DATA ---
const INITIAL_FLEET = [
  // CARS
  { id: 1, category: 'Car', name: "Audi A6 Matrix", price: 120, km: 12000, condition: "Excellent", type: "Diesel", drive: "AWD", seats: 5, plate: "KA-05-MQ-9999", image: "https://images.unsplash.com/photo-1541899481282-d53bffe3c35d?q=80&w=800&auto=format&fit=crop", isBooked: false, bookingInfo: null },
  { id: 2, category: 'Car', name: "Ford Mustang GT", price: 250, km: 5000, condition: "Good", type: "Petrol", drive: "RWD", seats: 4, plate: "KA-51-MD-7777", image: "https://images.unsplash.com/photo-1493238792000-8113da705763?q=80&w=800&auto=format&fit=crop", isBooked: false, bookingInfo: null },
  // BIKES
  { id: 3, category: 'Bike', name: "KTM RC 390", price: 40, km: 8000, condition: "Sport", type: "Petrol", drive: "Chain", seats: 2, plate: "KA-03-HA-4500", image: "https://images.unsplash.com/photo-1449426468159-d96dbf08f19f?q=80&w=800&auto=format&fit=crop", isBooked: false, bookingInfo: null },
  { id: 4, category: 'Bike', name: "Ducati Panigale", price: 60, km: 2000, condition: "Mint", type: "Petrol", drive: "Chain", seats: 2, plate: "KA-01-NJ-3000", image: "https://images.unsplash.com/photo-1568772585407-9361f9bf3a87?q=80&w=800&auto=format&fit=crop", isBooked: false, bookingInfo: null },
  // TRUCKS
  { id: 5, category: 'Truck', name: "Tata Prima 5530", price: 300, km: 50000, condition: "Heavy Duty", type: "Diesel", drive: "6x4", seats: 2, plate: "KA-53-TR-9900", image: "https://images.unsplash.com/photo-1601584115197-04ecc0da31d7?q=80&w=800&auto=format&fit=crop", isBooked: false, bookingInfo: null }
];

function App() {
  const initialUser = JSON.parse(localStorage.getItem('currentUser')) || null;
  const initialRole = localStorage.getItem('role') || 'user';
  const initialView = initialUser ? (initialRole === 'admin' ? 'admin-dash' : 'user-dash') : 'landing';

  const [view, setView] = useState(initialView); 
  const [role, setRole] = useState(initialRole); 
  
  // Data
  const [fleet, setFleet] = useState(() => JSON.parse(localStorage.getItem('fleet_v5')) || INITIAL_FLEET);
  const [users, setUsers] = useState(() => JSON.parse(localStorage.getItem('users')) || []);
  const [rentalHistory, setRentalHistory] = useState(() => JSON.parse(localStorage.getItem('rentalHistory')) || []);
  
  // State
  const [currentUser, setCurrentUser] = useState(initialUser);
  const [selectedVehicle, setSelectedVehicle] = useState(null);
  const [editingVehicle, setEditingVehicle] = useState(null);
  
  // Forms
  const [formData, setFormData] = useState({});
  const [newVehicleData, setNewVehicleData] = useState({ category: 'Car' }); // State for the separate Add Page
  const [otpSent, setOtpSent] = useState(null);
  
  // FILTER STATES (Default is now 'Car', 'All' is removed)
  const [categoryFilter, setCategoryFilter] = useState('Car'); 
  const [adminCategory, setAdminCategory] = useState('Car');

  useEffect(() => { localStorage.setItem('fleet_v5', JSON.stringify(fleet)); }, [fleet]);
  useEffect(() => { localStorage.setItem('users', JSON.stringify(users)); }, [users]);
  useEffect(() => { localStorage.setItem('rentalHistory', JSON.stringify(rentalHistory)); }, [rentalHistory]);
  useEffect(() => { localStorage.setItem('currentUser', JSON.stringify(currentUser)); }, [currentUser]);
  useEffect(() => { localStorage.setItem('role', role); }, [role]);

  // --- LOGIC ---
  const calculateFine = (booking) => {
    if (!booking) return 0;
    const end = new Date(booking.endDate);
    const today = new Date();
    const diffTime = today - end;
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
    return diffDays > 0 ? diffDays * booking.pricePerDay * 2 : 0;
  };

  const handleRegister = (e) => {
    e.preventDefault();
    if (!otpSent) {
      const code = Math.floor(1000 + Math.random() * 9000);
      alert(`OTP Verification Code: ${code}`);
      setOtpSent(code);
      return;
    }
    if (parseInt(formData.otp) !== otpSent) return alert("Wrong OTP entered.");
    const newUser = { ...formData, role: 'user' };
    setUsers([...users, newUser]);
    alert("Registration Successful!");
    setView('login');
    setOtpSent(null);
  };

  const handleLogin = (e) => {
    e.preventDefault();
    if (role === 'admin') {
      if (formData.username === 'admin' && formData.password === 'admin123') {
        setCurrentUser({ name: 'Administrator', role: 'admin' });
        setView('admin-dash');
      } else { alert("Invalid Admin Credentials"); }
    } else {
      const user = users.find(u => u.phone === formData.phone && u.password === formData.password);
      if (user) {
        setCurrentUser(user);
        setView('user-dash');
      } else { alert("User not found or wrong password"); }
    }
  };

  const confirmBooking = (e) => {
    e.preventDefault();
    const updatedFleet = fleet.map(v => {
      if (v.id === selectedVehicle.id) {
        return { 
          ...v, 
          isBooked: true, 
          bookingInfo: { 
            user: currentUser, 
            startDate: formData.startDate,
            endDate: formData.endDate,
            pricePerDay: v.price,
            rentedOn: new Date().toISOString()
          } 
        };
      }
      return v;
    });
    setFleet(updatedFleet);
    alert("Booking Confirmed!");
    setView('user-dash');
  };

  const returnVehicle = (vehicleId) => {
    const vehicle = fleet.find(v => v.id === vehicleId);
    if(vehicle && vehicle.bookingInfo) {
        const fine = calculateFine(vehicle.bookingInfo);
        const historyRecord = {
            id: Date.now(),
            category: vehicle.category,
            name: vehicle.name,
            plate: vehicle.plate,
            user: vehicle.bookingInfo.user.name,
            returnedOn: new Date().toLocaleDateString(),
            fine: fine,
            status: fine > 0 ? 'LATE RETURN' : 'ON TIME'
        };
        setRentalHistory([historyRecord, ...rentalHistory]);
    }
    setFleet(fleet.map(v => v.id === vehicleId ? { ...v, isBooked: false, bookingInfo: null } : v));
  };

  // ADD VEHICLE LOGIC (From Separate Page)
  const addNewVehicleInfo = (e) => {
    e.preventDefault();
    const newVehicle = {
      ...newVehicleData,
      id: Date.now(),
      isBooked: false,
      bookingInfo: null,
      // Add defaults if fields are missing
      image: newVehicleData.image || "https://via.placeholder.com/400x200?text=No+Image", 
      km: newVehicleData.km || 0,
      condition: newVehicleData.condition || 'New'
    };
    
    setFleet([...fleet, newVehicle]);
    alert(`${newVehicle.category.toUpperCase()} ADDED SUCCESSFULLY!`);
    setNewVehicleData({ category: 'Car' }); // Reset form
    setView('admin-dash'); // Go back to dashboard
  };

  const saveEditedVehicle = (e) => {
    e.preventDefault();
    setFleet(fleet.map(v => v.id === editingVehicle.id ? { ...v, ...editingVehicle } : v));
    setEditingVehicle(null);
  };

  const getStatus = (v) => {
    if (!v.isBooked) return 'available';
    if (currentUser && v.bookingInfo?.user?.phone === currentUser.phone) return 'mine';
    return 'others';
  };

  // --- VIEWS ---
  if (view === 'landing') return (
    <div className="landing-screen">
      <div className="bg-overlay"></div>
      <h1 className="cinematic-title">VELOCITY RENTALS</h1>
      <p className="subtitle">CARS • BIKES • HEAVY TRANSPORT</p>
      <div style={{display:'flex', gap:'20px', zIndex:2}}>
        <button onClick={() => { setRole('admin'); setView('login'); }}>ADMIN PORTAL</button>
        <button onClick={() => { setRole('user'); setView('login'); }}>CLIENT PORTAL</button>
      </div>
    </div>
  );

  if (view === 'login' || view === 'register') return (
    <div className="auth-screen">
      <div className="bg-overlay"></div>
      <div className="glass-panel">
        <h2>{role.toUpperCase()} {view === 'login' ? 'LOGIN' : 'REGISTER'}</h2>
        {role === 'admin' ? (
           <form onSubmit={handleLogin}>
              <p className="neon-text-small">SECURE ADMIN ACCESS</p>
              <input type="text" placeholder="Username" onChange={e => setFormData({...formData, username: e.target.value})} required />
              <input type="password" placeholder="Password" onChange={e => setFormData({...formData, password: e.target.value})} required />
              <button className="action-btn">LOGIN</button>
              <button type="button" className="back-btn" onClick={() => setView('landing')}>BACK</button>
           </form>
        ) : (
           <form onSubmit={view === 'login' ? handleLogin : handleRegister}>
             {view === 'register' && (
               <div style={{maxHeight:'200px', overflowY:'auto'}}>
                 <input type="text" placeholder="Full Name" onChange={e => setFormData({...formData, name: e.target.value})} required />
                 <input type="date" onChange={e => setFormData({...formData, dob: e.target.value})} required />
                 <input type="text" placeholder="Aadhar Number" onChange={e => setFormData({...formData, aadhar: e.target.value})} required />
                 <input type="text" placeholder="License Number" onChange={e => setFormData({...formData, license: e.target.value})} required />
                 <input type="email" placeholder="Email Address" onChange={e => setFormData({...formData, email: e.target.value})} required />
               </div>
             )}
             <input type="text" placeholder="Phone Number" onChange={e => setFormData({...formData, phone: e.target.value})} required />
             <input type="password" placeholder="Password" onChange={e => setFormData({...formData, password: e.target.value})} required />
             {view === 'register' && otpSent && <input type="text" placeholder="OTP" onChange={e => setFormData({...formData, otp: e.target.value})} required />}
             <button className="action-btn">{view === 'login' ? 'LOGIN' : otpSent ? 'VERIFY' : 'SEND OTP'}</button>
             <p className="link-text" onClick={() => { setView(view === 'login' ? 'register' : 'login'); setOtpSent(null); }}>
               {view === 'login' ? "New User? Register Now" : "Back to Login"}
             </p>
             <button type="button" className="back-btn" onClick={() => setView('landing')}>BACK</button>
           </form>
        )}
      </div>
    </div>
  );

  if (view === 'user-dash') return (
    <div className="dashboard">
      <div className="bg-overlay"></div>
      <div className="nav-bar"><span>HELLO, {currentUser?.name}</span> <button onClick={() => { setCurrentUser(null); setView('landing'); }}>LOGOUT</button></div>
      
      {/* CATEGORY TABS (REMOVED 'ALL') */}
      <div className="tabs-container">
         {['Car', 'Bike', 'Truck'].map(cat => (
           <button 
             key={cat} 
             className={`tab-btn ${categoryFilter === cat ? 'active' : ''}`}
             onClick={() => setCategoryFilter(cat)}
           >{cat.toUpperCase()}S</button>
         ))}
      </div>

      <div className="scroll-wrapper">
        <div className="grid-container">
          {fleet.filter(v => v.category === categoryFilter).map(v => {
            const status = getStatus(v);
            return (
              <div key={v.id} className={`vehicle-card ${status}`} onClick={() => { setSelectedVehicle(v); setView('vehicle-detail'); }}>
                <img src={v.image} alt="" />
                <div className="card-info">
                  <h3>{v.name}</h3>
                  <div style={{display:'flex', justifyContent:'space-between', alignItems:'center', marginTop:'5px'}}>
                    <p style={{margin:0, color:'#aaa'}}>{v.category} | {v.type}</p>
                    <strong style={{color:'var(--neon)', fontSize:'1.1rem'}}>${v.price}/day</strong>
                  </div>
                  <span className={`badge ${status}`}>{status === 'mine' ? 'YOURS' : status === 'others' ? 'RENTED' : 'OPEN'}</span>
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );

  if (view === 'vehicle-detail') {
    const status = getStatus(selectedVehicle);
    return (
      <div className="detail-view">
        <div className="bg-overlay"></div>
        <div className="detail-glass wide-layout">
          <button className="close-btn" onClick={() => setView('user-dash')}>X</button>
          
          <div className="detail-split-container">
            <div className="detail-left">
               <img src={selectedVehicle.image} alt="vehicle" className="hero-image" />
               <div className="price-tag-large">${selectedVehicle.price} <span>/ DAY</span></div>
            </div>
            <div className="detail-right">
               <h2 className="detail-title">{selectedVehicle.name}</h2>
               <div className="detail-badges"><span>{selectedVehicle.category}</span><span>{selectedVehicle.condition}</span></div>
               
               <div className="specs-box-grid">
                  <div className="spec-item"><small>ENGINE</small><strong>{selectedVehicle.type}</strong></div>
                  <div className="spec-item"><small>DRIVE</small><strong>{selectedVehicle.drive}</strong></div>
                  <div className="spec-item"><small>SEATS</small><strong>{selectedVehicle.seats}</strong></div>
                  <div className="spec-item"><small>ODOMETER</small><strong>{selectedVehicle.km} KM</strong></div>
               </div>

               <div className="action-area">
                  {status === 'available' && (
                    <form onSubmit={confirmBooking}>
                      <div className="date-inputs">
                        <div><label>Pick-Up</label><input type="date" onChange={e => setFormData({...formData, startDate: e.target.value})} required /></div>
                        <div><label>Drop-Off</label><input type="date" onChange={e => setFormData({...formData, endDate: e.target.value})} required /></div>
                      </div>
                      <button className="action-btn neon-btn">CONFIRM BOOKING</button>
                    </form>
                  )}
                  {status === 'others' && (
                    <div className="status-box rented"><h3>RENTED OUT</h3><p>Return: {selectedVehicle.bookingInfo.endDate}</p></div>
                  )}
                  {status === 'mine' && (
                    <div className="status-box mine"><h3>BOOKING CONFIRMED</h3><p className="plate-reveal">PLATE: {selectedVehicle.plate}</p></div>
                  )}
               </div>
            </div>
          </div>
        </div>
      </div>
    );
  }

  // --- NEW SEPARATE ADD VEHICLE INTERFACE ---
  if (view === 'add-vehicle-page') return (
    <div className="auth-screen">
       <div className="bg-overlay"></div>
       <div className="glass-panel" style={{width:'500px', maxHeight:'90vh'}}>
          <h2 style={{borderBottom:'1px solid #333', paddingBottom:'10px'}}>ADD NEW {adminCategory.toUpperCase()}</h2>
          
          <form onSubmit={addNewVehicleInfo}>
             <div className="scrollable-form" style={{maxHeight:'500px'}}>
               <label>Vehicle Category</label>
               <select 
                 value={newVehicleData.category} 
                 onChange={e => setNewVehicleData({...newVehicleData, category: e.target.value})}
                 style={{width:'100%', padding:'10px', background:'#000', color:'#fff', border:'1px solid #333', marginBottom:'15px'}}
               >
                  <option value="Car">Car</option>
                  <option value="Bike">Bike</option>
                  <option value="Truck">Truck</option>
               </select>

               <label>Model Name</label>
               <input type="text" placeholder="e.g. BMW X5" onChange={e => setNewVehicleData({...newVehicleData, name: e.target.value})} required />
               
               <label>License Plate</label>
               <input type="text" placeholder="e.g. KA-01-XY-1234" onChange={e => setNewVehicleData({...newVehicleData, plate: e.target.value})} required />
               
               <label>Price Per Day ($)</label>
               <input type="number" placeholder="100" onChange={e => setNewVehicleData({...newVehicleData, price: e.target.value})} required />
               
               <label>Image URL (Paste "Copy Image Address")</label>
               <input type="text" placeholder="https://..." onChange={e => setNewVehicleData({...newVehicleData, image: e.target.value})} />
               
               <div style={{display:'flex', gap:'10px'}}>
                  <div style={{flex:1}}>
                    <label>Engine Type</label>
                    <input type="text" placeholder="Diesel/Petrol" onChange={e => setNewVehicleData({...newVehicleData, type: e.target.value})} />
                  </div>
                  <div style={{flex:1}}>
                    <label>Seats</label>
                    <input type="number" placeholder="4" onChange={e => setNewVehicleData({...newVehicleData, seats: e.target.value})} />
                  </div>
               </div>

               <div style={{display:'flex', gap:'10px'}}>
                  <div style={{flex:1}}>
                    <label>Drive (AWD/RWD)</label>
                    <input type="text" placeholder="AWD" onChange={e => setNewVehicleData({...newVehicleData, drive: e.target.value})} />
                  </div>
                  <div style={{flex:1}}>
                    <label>Odometer (KM)</label>
                    <input type="number" placeholder="5000" onChange={e => setNewVehicleData({...newVehicleData, km: e.target.value})} />
                  </div>
               </div>
             </div>

             <button className="action-btn neon-btn">ADD TO FLEET</button>
             <button type="button" className="back-btn" onClick={() => setView('admin-dash')}>CANCEL / BACK</button>
          </form>
       </div>
    </div>
  );

  if (view === 'admin-dash') return (
    <div className="admin-dashboard">
       <div className="bg-overlay"></div>
       <div className="nav-bar"><span>ADMIN</span> <button onClick={() => { setCurrentUser(null); setView('landing'); }}>LOGOUT</button></div>
       
       <div className="tabs-container admin-tabs">
          {['Car', 'Bike', 'Truck'].map(cat => (
             <button key={cat} className={`tab-btn ${adminCategory === cat ? 'active' : ''}`} onClick={() => setAdminCategory(cat)}>{cat.toUpperCase()}S</button>
          ))}
       </div>

       <div className="admin-split">
         {/* INVENTORY PANEL */}
         <div className="panel">
           <h3>{adminCategory.toUpperCase()} INVENTORY</h3>
           <div className="table-scroll">
             <table>
               <thead><tr><th>Model</th><th>Plate</th><th>Status</th><th>Actions</th></tr></thead>
               <tbody>
                 {fleet.filter(v => v.category === adminCategory).map(v => (
                   <tr key={v.id}>
                     <td>{v.name}</td><td>{v.plate}</td>
                     <td style={{color: v.isBooked ? 'var(--danger)' : 'var(--neon)'}}>{v.isBooked ? 'RENTED' : 'IDLE'}</td>
                     <td>
                       <button onClick={() => setEditingVehicle(v)}>EDIT</button> 
                       <button onClick={() => setFleet(fleet.filter(x => x.id !== v.id))} style={{color:'red'}}>DEL</button>
                     </td>
                   </tr>
                 ))}
               </tbody>
             </table>
           </div>
           
           {/* NEW BUTTON LOGIC: Opens Separate Page */}
           <button className="action-btn" onClick={() => {
              setNewVehicleData({ category: adminCategory }); // Set default category
              setView('add-vehicle-page'); // Switch to new page
           }}>+ ADD NEW {adminCategory.toUpperCase()}</button>
         </div>

         {/* RENTALS PANEL */}
         <div className="panel">
           <h3>{adminCategory.toUpperCase()} RENTALS</h3>
           <div className="scroll-rentals">
             {fleet.filter(v => v.category === adminCategory && v.isBooked).length === 0 && <p style={{opacity:0.5}}>No active rentals.</p>}
             
             {fleet.filter(v => v.category === adminCategory && v.isBooked).map(v => (
               <div key={v.id} className="rental-log">
                 <strong>{v.name}</strong> <br/> User: {v.bookingInfo.user.name}
                 <button onClick={() => returnVehicle(v.id)} style={{float:'right', padding:'5px', marginTop:'-20px'}}>RETURN</button>
               </div>
             ))}

             <h4 style={{marginTop: '20px', borderTop:'1px solid #333', paddingTop:'10px'}}>HISTORY ({adminCategory})</h4>
             {rentalHistory.filter(h => h.category === adminCategory).map(h => (
               <div key={h.id} className="history-row"><span>{h.name}</span> <span>{h.status}</span></div>
             ))}
           </div>
         </div>
       </div>

       {editingVehicle && (
         <div className="auth-screen" style={{position:'absolute', top:0, left:0, width:'100%', zIndex:100}}>
           <div className="glass-panel">
             <h3>EDIT {editingVehicle.category.toUpperCase()}</h3>
             <input value={editingVehicle.name} placeholder="Name" onChange={e => setEditingVehicle({...editingVehicle, name: e.target.value})} />
             <input value={editingVehicle.plate} placeholder="Plate" onChange={e => setEditingVehicle({...editingVehicle, plate: e.target.value})} />
             <input value={editingVehicle.price} type="number" placeholder="Price" onChange={e => setEditingVehicle({...editingVehicle, price: e.target.value})} />
             <input value={editingVehicle.image} placeholder="Paste Image Address here" onChange={e => setEditingVehicle({...editingVehicle, image: e.target.value})} />
             <button className="action-btn" onClick={saveEditedVehicle}>SAVE</button>
             <button className="back-btn" onClick={() => setEditingVehicle(null)}>CANCEL</button>
           </div>
         </div>
       )}
    </div>
  );
}

export default App;