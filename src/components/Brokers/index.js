import React, { useEffect, useState } from 'react';
import { addBroker } from '../../services/brokers';
import './Brokers.css';
import { ReactComponent as CloseIcon } from '../../assets/icons/close-icon.svg';
import { ReactComponent as AddIcon } from '../../assets/icons/add-circle-icon.svg';
import { ReactComponent as SearchIcon } from '../../assets/icons/search-icon.svg';
import { ReactComponent as DeleteIcon } from '../../assets/icons/delete-icon.svg';
import { addTotalValue, deleteTotalValue } from '../../services/totalValues';

const Brokers = ({ brokersData, totalValuesData, setRefresh, fetchingAgain }) => {
    const [brokers, setBrokers] = useState(brokersData || []);
    const [newBrokerName, setNewBrokerName] = useState('');
    const [newBrokerCurrency, setNewBrokerCurrency] = useState('');
    const [selectedBroker, setSelectedBroker] = useState(null);
    const [isAddingBroker, setIsAddingBroker] = useState(false);
    const [isAddingTotalValue, setIsAddingTotalValue] = useState(false);
    const [isSearchingTotalValue, setIsSearchingTotalValue] = useState(false);
    const [totalValues, setTotalValues] = useState(totalValuesData || []);
    const [selectedYear, setSelectedYear] = useState(new Date().getFullYear());
    const [searchBroker, setSearchBroker] = useState('');
    const [searchMonth, setSearchMonth] = useState('');

    useEffect(() => {
        setSelectedYear(new Date().getFullYear());
        setBrokers(brokersData || []);
        setTotalValues(totalValuesData || []);

    }, [brokersData, totalValuesData, fetchingAgain])

    const months = [
        'Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun',
        'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'
    ];

    const availableYears = [...new Set(totalValues.map(value => new Date(value.date).getFullYear()))];

    const getBrokerMonthlyTotals = (broker, monthIndex, year = selectedYear) => {
        const monthlyValue = totalValues.find(value => {
            if (!value.date) return false;
            const [y, m] = value.date.split('-');
            return (
                value.broker.broker === broker &&
                Number(m) - 1 === monthIndex &&
                Number(y) === year
            );
        });

        const totalUSD = monthlyValue ? parseFloat(monthlyValue.totalValueInUSD || 0) : 0;
        const totalBRL = monthlyValue ? parseFloat(monthlyValue.totalValueInBRL || 0) : 0;

        return { totalUSD, totalBRL };
    };

    const handleAddBroker = async () => {
        if (newBrokerName.trim() !== '' && newBrokerCurrency.trim() !== '') {
            try {
                const newBroker = {
                    brokerName: newBrokerName,
                    currency: newBrokerCurrency,
                };
                const addedBroker = await addBroker(newBroker);
                setBrokers([...brokers, addedBroker]);
                setNewBrokerName('');
                setNewBrokerCurrency('');
                setIsAddingBroker(false);
            } catch (error) {
                console.error('Error adding broker:', error);
            }
        }
    };

    const handleSelectBroker = (event) => {
        const selectedBrokerName = event.target.value;
        const broker = brokers.find(b => b.broker === selectedBrokerName);
        setSelectedBroker(broker)
    };

    const handleAddTotalValue = async (event) => {
        event.preventDefault();
        const date = event.target[0].value; // já está no formato 'YYYY-MM-DD'
        const amountInUSD = event.target[1].value;
        const amountInBRL = event.target[2].value;
        if (date && amountInBRL && amountInUSD && selectedBroker) {
            const totalValue = {
                date: date, // envie a string, não o objeto Date
                currency: selectedBroker.currency,
                totalValueInBRL: amountInBRL,
                totalValueInUSD: amountInUSD,
                broker: selectedBroker
            };
            try {
                const result = await addTotalValue(totalValue);
                setRefresh(prevRefresh => prevRefresh + 1)
                alert(result.msg)
                setIsAddingTotalValue(false);

            } catch (error) {
                console.log('Error adding total value:', error);
                
                alert('Error adding total value:', error.msg);
            }
        } else {
            alert('Please fill in all fields and select a broker');
        }
    };

    const calculateMonthlyTotals = () => {
        const monthlyTotals = months.map((_, monthIndex) => {
            let totalUSD = 0;
            let totalBRL = 0;

            totalValues.forEach(value => {
                const date = new Date(value.date);
                if (date.getMonth() === monthIndex && date.getFullYear() === selectedYear) {
                    totalUSD += parseFloat(value.totalValueInUSD || 0);
                    totalBRL += parseFloat(value.totalValueInBRL || 0);
                }
            });

            return { totalUSD, totalBRL };
        });

        return monthlyTotals;
    };

    // Função para filtrar os valores conforme busca
    const filteredTotalValues = totalValues.filter(value => {
        const [year, month] = value.date.split('-');
        const matchesYear = Number(year) === selectedYear;
        const matchesBroker = searchBroker ? value.broker.broker === searchBroker : true;
        const matchesMonth = searchMonth ? Number(month) === Number(searchMonth) : true;
        return matchesYear && matchesBroker && matchesMonth;
    });

    // Brokers e meses únicos para os selects
    const uniqueBrokers = [...new Set(totalValues
        .filter(v => Number(v.date.split('-')[0]) === selectedYear)
        .map(v => v.broker.broker)
    )];
    const uniqueMonths = [...new Set(totalValues
        .filter(v => Number(v.date.split('-')[0]) === selectedYear)
        .map(v => Number(v.date.split('-')[1]))
    )].sort((a, b) => a - b);

    const handleDeleteTotalValue = async (event) => {
        const id = event._id;
        if (id) {
            try {
                const result = await deleteTotalValue(id)
                setIsSearchingTotalValue(false)
                setSearchBroker('');
                setSearchMonth('');
                setRefresh(prev => prev + 1)           
                alert(result.message)
                setRefresh(prevRefresh => prevRefresh + 1)
            } catch (error) {
                alert('Error deleting total value:', error.msg)
            }
        } else {
            alert('Please select a total value to delete')
        }
    }

    return (
        <>
            {isAddingTotalValue ?
                <div className='broker-container'>
                    <h2 className='broker-tittle'>Brokers</h2>
                    <CloseIcon className='broker-close-icon' onClick={() => {
                        setIsAddingTotalValue(false);
                        setIsAddingBroker(false);
                    }} />
                    {isAddingBroker ?
                        <div className='broker-add-container'>
                            <CloseIcon className='broker-close-icon' onClick={() => setIsAddingBroker(false)} />
                            <input
                                className='broker-input'
                                type="text"
                                value={newBrokerName}
                                onChange={(e) => setNewBrokerName(e.target.value)}
                                placeholder="Broker Name"
                            />
                            <input
                                className='broker-input'
                                type="text"
                                value={newBrokerCurrency}
                                onChange={(e) => setNewBrokerCurrency(e.target.value)}
                                placeholder="Currency"
                            />
                            <button className='broker-button' onClick={handleAddBroker}>Add Broker</button>
                        </div>
                        : null
                    }

                    <div>
                        <label className='broker-label' htmlFor="brokerSelect">Select a Broker:</label>
                        <select
                            className='broker-select'
                            id="brokerSelect"
                            onChange={(e) => {
                                if (e.target.value === "Add New Broker") {
                                    setIsAddingBroker(true);
                                    setSelectedBroker(null);
                                    setNewBrokerName('');
                                    setNewBrokerCurrency('');
                                } else {
                                    handleSelectBroker(e);
                                    setIsAddingBroker(false);
                                }
                            }}
                        >
                            <option className='broker-option' value="">-- Select --</option>
                            {brokers.map((broker, index) => (
                                <option key={index} value={broker.broker}>
                                    {broker.broker} ({broker.currency})
                                </option>
                            ))}
                            <option className='broker-option' value="Add New Broker">Add New Broker</option>
                        </select>
                    </div>
                    <form onSubmit={handleAddTotalValue} className='broker-form'>
                        <input
                            className='broker-input'
                            type="date"
                            placeholder="Date"
                        />
                        <div className='broker-amount-container'>
                            <input
                                className='broker-input'
                                type="number"
                                placeholder="Total Amount"
                            />
                            {selectedBroker ?
                                <p>USD</p>
                                : null
                            }
                        </div>
                        <div className='broker-amount-container'>
                            <input
                                className='broker-input'
                                type="number"
                                placeholder="Total Amount"
                            />
                            {selectedBroker ?
                                <p>BRL</p>
                                : null
                            }
                        </div>
                        <button className='broker-button' type="submit">Add Total Value</button>

                    </form>
                </div>
                : null
            }

            <div className='year-selector' style={{ marginTop: '20px' }}>
                <label className='year-select' style={{ border: 0 }} htmlFor="yearSelect">Select Year:</label>
                <select
                    className='year-select'
                    id="yearSelect"
                    value={selectedYear}
                    onChange={(e) => setSelectedYear(parseInt(e.target.value))}
                >
                    {availableYears.map((year, index) => (
                        <option key={index} value={year}>
                            {year}
                        </option>
                    ))}
                </select>
            </div>

            <div className='broker-header'>
                <h2 className='broker-tittle'>Monthly Totals</h2>
                <SearchIcon className='broker-search-icon' onClick={() => setIsSearchingTotalValue(true)} />
                <AddIcon className='broker-add-icon' onClick={() => setIsAddingTotalValue(true)} />
            </div>

            {isSearchingTotalValue ?
            <div className='total-value-search'>
                <div>
                    <label htmlFor="searchBroker">Broker:</label>
                    <select
                    id="searchBroker"
                    value={searchBroker}
                    onChange={e => setSearchBroker(e.target.value)}
                >
                    <option value="">--</option>
                    {uniqueBrokers.map((broker, idx) => (
                        <option key={idx} value={broker}>{broker}</option>
                    ))}
                </select>
                <label htmlFor="searchMonth" style={{ marginLeft: 10 }}>Month:</label>
                <select
                    id="searchMonth"
                    value={searchMonth}
                    onChange={e => setSearchMonth(e.target.value)}
                >
                    <option value="">--</option>
                    {uniqueMonths.map(m => (
                        <option key={m} value={m}>{months[m - 1]}</option>
                    ))}
                </select>
                </div>
                <CloseIcon className='broker-close-icon' onClick={() => 
                    {setIsSearchingTotalValue(false)
                    setSearchBroker('');
                    setSearchMonth('');
                    }
                }
                    />

                <div className='broker-search-results'>
                    {(searchBroker && searchMonth && filteredTotalValues.length > 0) ? (
                        <ul>
                            {filteredTotalValues.map((value, index) => (
                                <li key={index}>
                                    <p>{value.broker.broker} - {months[Number(value.date.split('-')[1]) - 1]} - {value.totalValueInUSD} USD / {value.totalValueInBRL} BRL</p>
                                    <DeleteIcon className='broker-delete-icon' onClick={() => handleDeleteTotalValue(value)} />
                                </li>
                            ))}
                        </ul>
                    ) : null}
                </div>
            </div>
            : null
        }
            
            

            {totalValues ?
                <div className='broker-table-wrapper'>
                    <table className='broker-table'>
                        <thead>
                            <tr>
                                <th>Broker</th>
                                {months.map((month, index) => (
                                    <th key={index}>{month}</th>
                                ))}
                            </tr>
                        </thead>
                        <tbody>
                            {brokers.map((broker, brokerIndex) => (
                                <React.Fragment key={brokerIndex}>
                                    <tr>
                                        <td className='broker-name'>{broker.broker}</td>
                                    </tr>
                                    <tr>
                                        <td>USD</td>
                                        {months.map((_, monthIndex) => {
                                            const { totalUSD } = getBrokerMonthlyTotals(broker.broker, monthIndex);
                                            return (
                                                <td key={monthIndex}>
                                                    {totalUSD.toFixed(2)}
                                                </td>
                                            );
                                        })}
                                    </tr>
                                    <tr>
                                        <td>BRL</td>
                                        {months.map((_, monthIndex) => {
                                            const { totalBRL } = getBrokerMonthlyTotals(broker.broker, monthIndex);
                                            return (
                                                <td key={monthIndex}>
                                                    {totalBRL.toFixed(2)}
                                                </td>
                                            );
                                        })}
                                    </tr>
                                </React.Fragment>
                            ))}
                            <tr className='total-row'>
                                <td>Total USD</td>
                                {calculateMonthlyTotals().map((totals, monthIndex) => (
                                    <td key={monthIndex}>
                                        {totals.totalUSD.toFixed(2)}
                                    </td>
                                ))}
                            </tr>
                            <tr className='total-row'>
                                <td>Total BRL</td>
                                {calculateMonthlyTotals().map((totals, monthIndex) => (
                                    <td key={monthIndex}>
                                        {totals.totalBRL.toFixed(2)}
                                    </td>
                                ))}
                            </tr>
                        </tbody>
                    </table>
                </div>
                : <p className='broker-no-data'>Loading...</p>}

            <h2 className='footer'>Yield Management</h2>
        </>
    );
};

export default Brokers;